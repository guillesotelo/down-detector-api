const { exec } = require("child_process")
const dotenv = require('dotenv')
dotenv.config()
const { isValidUrl } = require("../helpers")
const { System, History, AppLog, UserAlert, Event, Config, Subscription } = require("../db/models")
const { sendEmail } = require("../mailer")
const { systemDown, systemUp } = require("../mailer/emailTemplates")
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
let intervalId = null
let checkIndex = 1

const chartDataCache = new Map()

const getHourKey = (date) => {
    const d = new Date(date)
    d.setMinutes(0, 0, 0)
    return d.getTime()
}

const getHourISOString = (hoursAgo) => {
    const today = new Date()
    today.setMinutes(0, 0, 0)
    today.setHours(today.getHours() - hoursAgo)
    return today.toISOString()
}

const processChartSet = (history, hourSet = 336) => {
    if (!history || !history.length) return []

    const lastRegister = history[0]
    const firstRegister = history[history.length - 1]
    const lastStatus = lastRegister.status ? 1 : 0

    const firstTimeMs = getHourKey(firstRegister.createdAt)
    const lastTimeMs = getHourKey(lastRegister.createdAt)

    const allHours = new Map()

    const sortedOldToNew = [...history].reverse()

    sortedOldToNew
        .map((item, i, arr) => {
            if (!item.status) {
                const currentTime = new Date(item.createdAt).getTime()
                const nextTime = arr[i + 1] ? new Date(arr[i + 1].createdAt).getTime() : null
                const nextStatus = arr[i + 1] ? arr[i + 1].status : item.status
                const isBusy = Date.now() - currentTime < 120000
                if (isBusy || (nextStatus && nextStatus !== item.status && nextTime && nextTime - currentTime < 120000)) {
                    return { ...item, status: 'BUSY', busy: true }
                }
            }
            return item
        })
        .forEach((register, i, arr) => {
            const timeMs = getHourKey(register.createdAt)
            const currentTime = new Date(register.createdAt).getTime()

            if (allHours.has(timeMs)) {
                const existing = allHours.get(timeMs)
                const prevTime = new Date(existing.createdAt).getTime()

                if (arr.length < 3) {
                    allHours.set(timeMs, {
                        ...register,
                        status: register.status ? 1 : 0,
                        busy: existing.busy || false,
                        isDown: !register.status || !existing.status
                    })
                }

                const nextTime = arr[i + 1] ? new Date(arr[i + 1].createdAt).getTime() : null
                if (nextTime && (nextTime - currentTime < 180000) && arr[i + 1].status !== register.status) {
                    allHours.set(timeMs, {
                        ...register,
                        status: arr[i + 1].status ? 1 : 0,
                        busy: arr[i + 1].busy || false,
                        isDown: !arr[i + 1].status || !register.status || !allHours.get(timeMs).status
                    })
                } else if (currentTime - prevTime < 180000) {
                    allHours.set(timeMs, {
                        ...register,
                        status: register.status ? 1 : 0,
                        busy: existing.busy || false,
                        isDown: !register.status || !existing.status
                    })
                } else {
                    const nextRegisteredHour = arr[i + 1] ? new Date(arr[i + 1].createdAt).getTime() : null
                    const currentHour = new Date(register.createdAt).getTime()
                    if (nextRegisteredHour && nextRegisteredHour - currentHour > 3600000) {
                        const nextHourDate = new Date(register.createdAt)
                        nextHourDate.setHours(nextHourDate.getHours() + 1)
                        nextHourDate.setMinutes(0, 0, 0)
                        allHours.set(nextHourDate.getTime(), {
                            ...register,
                            createdAt: nextHourDate.toISOString(),
                            status: register.status ? 1 : 0,
                            isDown: !register.status || !allHours.get(timeMs).status
                        })
                    }
                }
            } else {
                allHours.set(timeMs, {
                    ...register,
                    status: register.status ? 1 : 0,
                    isDown: !register.status
                })
            }
        })

    let prevStatus = 1
    let prevBusy = false
    let prevIsDown = false

    const set = Array.from({ length: hourSet + 2 }).map((_, i) => {
        const timeIso = getHourISOString(hourSet - i)
        const timeMs = new Date(timeIso).getTime()
        let status = lastStatus
        let unknown = false
        let busy = false
        let isDown = false

        if (allHours.size > 1) {
            if (timeMs > lastTimeMs) {
                // After last registered: use lastStatus (already initialized above)
            } else if (timeMs < firstTimeMs) {
                unknown = true
            } else if (allHours.has(timeMs)) {
                const register = allHours.get(timeMs)
                status = register.status
                prevStatus = register.status
                busy = register.busy || false
                prevBusy = register.busy || false
                isDown = register.isDown
                prevIsDown = register.isDown
            } else {
                status = prevStatus
                busy = prevBusy
                isDown = prevIsDown
                prevStatus = 1
                prevBusy = false
                prevIsDown = false
            }
        } else if (allHours.size === 1) {
            status = allHours.values().next().value.status
            if (timeMs < firstTimeMs) unknown = true
        }

        return { time: timeIso, status, unknown, busy, isDown }
    })

    return set
}

const buildChartDataForSystem = (systemId, history, alerts) => {
    const reportedHourKeys = new Set()
    if (alerts && alerts.length) {
        alerts.forEach(el => {
            if (el.createdAt) reportedHourKeys.add(getHourKey(el.createdAt))
        })
    }

    const twoWeeksSet = processChartSet(history, 336)
    const lastDaySet = twoWeeksSet.slice(Math.max(twoWeeksSet.length - 25, 0))

    const markReported = (item) => {
        const ms = new Date(item.time).getTime()
        return reportedHourKeys.has(ms) ? { ...item, reported: true } : item
    }

    return {
        systemId: systemId.toString(),
        lastDayData: lastDaySet.map(markReported),
        completeData: twoWeeksSet.map(markReported)
    }
}

const updateChartDataCache = async (systems) => {
    try {
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 16)
        startDate.setHours(0, 0, 0, 0)

        await Promise.all(systems.map(async (system) => {
            const systemId = system._id.toString()
            const [history, alerts] = await Promise.all([
                History.find({ systemId, createdAt: { $gte: startDate } })
                    .select('-raw -description')
                    .sort({ createdAt: -1 }),
                UserAlert.find({ systemId }).sort({ createdAt: -1 })
            ])
            chartDataCache.set(systemId, buildChartDataForSystem(systemId, history, alerts))
        }))
    } catch (error) {
        console.error('Error updating chart data cache:', error)
    }
}

const zuul_events = [
    "ad-zen-gerrit",
    "artadfsp-gerrit",
    "artbf-common-tools-gerrit",
    "artinfo-gerrit",
    "artroad-gerrit",
    "asad-hil-gerrit",
    "aurora-gerrit",
    "bc-function-sw-gerrit",
    "buildciartbf",
    "csp-gerrit",
    "eps-sw-gerrit",
    "gerrit",
    "gitlab-cm",
    "icup-tcam-gerrit",
    "lpcfiocdev",
    "shared-gerrit",
    "spas-gerrit",
    "vs-gerrit"
]

const checkZuulStatus = (system, json) => {
    let check = true
    const {
        connection_event_queues,
        pipelines
    } = json
    const stringJson = JSON.stringify(json)

    if (connection_event_queues && pipelines) {
        Object.keys(connection_event_queues).forEach(key => {
            if (!zuul_events.includes(key)) check = false
        })
        if (pipelines.length < 18) check = false
        return {
            raw: stringJson,
            status: check,
            message: `System up and running`
        }
    }
    return {
        raw: stringJson,
        status: false,
        message: `Unexpected error: ${system.name}`
    }
}

const getBroadcastedMessages = async url => {
    try {
        const res = await fetch(url)
        if (res.headers.get('content-type').includes('application/json')) {
            const json = await res.text() || []
            return typeof json === 'string' ? json : JSON.stringify(json)
        }
        return '[]'
    } catch (error) {
        console.error(error)
        return '[]'
    }
}

const getSystemStatus = async (system, response) => {
    try {
        const { name, broadcastMessages } = system
        const systemName = name.toLowerCase()

        let jsonResponse
        let newBroadcast = broadcastMessages || '[]'
        const contentType = response.headers.get('content-type')
        const textResponse = await response.text()

        if (contentType && contentType.includes('application/json')) {
            const jsonpPrefix = ')]}\''
            if (textResponse.startsWith(jsonpPrefix)) {
                const jsonpBody = textResponse.slice(jsonpPrefix.length)
                jsonResponse = JSON.parse(jsonpBody)
            } else jsonResponse = JSON.parse(textResponse)
        } else jsonResponse = textResponse

        const stringJsonResponse = JSON.stringify(jsonResponse)

        if (systemName.includes('vira') || systemName.includes('confluence')) {
            newBroadcast = await getBroadcastedMessages(`https://confluence.${process.env.COMPANY_NAME}.biz/`)
            if (jsonResponse.state && jsonResponse.state === 'RUNNING') {
                return {
                    broadcastMessages: newBroadcast,
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }
        else if (systemName.includes('artifactory')) {
            if (jsonResponse.code && jsonResponse.code === 'OK') {
                return {
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }
         else if (systemName.includes('jenkins')) {
            if (textResponse.includes('Authentication required')) {
                return {
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }
        else if (systemName.includes('gitlab')) {
            newBroadcast = await getBroadcastedMessages(`https://gitlab.cm.${process.env.COMPANY_NAME}.biz/api/v4/broadcast_messages`)
            if (stringJsonResponse.split('ok').length && stringJsonResponse.split('ok').length >= 16) {
                return {
                    broadcastMessages: newBroadcast,
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }
        else if (systemName.includes('gerrit') && !(system.dashboard || '').includes('INFO')) {
            if (jsonResponse.gerrit) {
                return {
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }
        else if (systemName.includes('rms')) {
            if (jsonResponse.includes('<title>RMS</title>') &&
                jsonResponse.includes('bundle.js')) {
                return {
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }
        else if (systemName.includes('confighub')) {
            if (jsonResponse.includes('<title>ConfigHub</title>')) {
                return {
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }
        else if (systemName.includes('hp report')) {
            if (jsonResponse.includes('HP Software Platform')) {
                return {
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }

        else if (systemName.includes('veronica')) {
            const hours = new Date().getHours()
            const isIngesting = (hours >= 6 && hours < 8)
            const uiIsUp = await fetch(system.url.replace('api/get_model_settings', '')).catch(_ => false)
            if (uiIsUp && (stringJsonResponse.includes('model_name') || isIngesting)) {
                return {
                    raw: stringJsonResponse,
                    status: true,
                    message: isIngesting ? 'Ingest automation in progress' : `System up and running`
                }
            }
        }

        // After complaints about results, page URL has changed and checkZuulStatus is no longer a good option
        // else if (systemName.includes('zuul')) return checkZuulStatus(system, jsonResponse)

        else if (response.ok) {
            return {
                broadcastMessages: newBroadcast,
                raw: stringJsonResponse,
                status: true,
                message: `System up and running`,
                firstStatus: true
            }
        }
        return {
            broadcastMessages: newBroadcast,
            raw: stringJsonResponse,
            status: false,
            message: `Wrong response type: ${name}`,
            firstStatus: false
        }

    } catch (error) {
        console.log(error)

        const hostname = error?.cause?.hostname || hostNameError
        // Excemption for Veronica
        const hours = new Date().getHours()
        const isIngesting = (hours >= 6 && hours < 8)
        if (hostname && String(hostname).includes('hpchatbot') && isIngesting) {
            return {
                raw: JSON.stringify(error),
                status: false,
                message: `Ingest automation in progress`,
                broadcastMessages: '[]'
            }
        }

        return {
            raw: String(error),
            status: false,
            message: `Unexpected error: ${error}`,
            firstStatus: false
        }
    }
}

const checkSystemStatus = async (system) => {
    const { url, timeout, name, broadcastMessages } = system
    const maxRetries = 2
    let attempts = 0

    while (attempts < maxRetries) {
        try {
            if (!isValidUrl(url)) {
                return {
                    raw: '{}',
                    status: false,
                    attempts: 1, // Invalid URL fails on first try
                    message: `URL not valid: "${url}"`,
                    broadcastMessages: broadcastMessages || '[]'
                }
            }

            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), timeout && typeof timeout === 'number' ? timeout : 10000)

            const response = await fetch(url, { signal: controller.signal })
            clearTimeout(timeoutId)

            // Pass attempts to getSystemStatus if it needs to log it
            return getSystemStatus(system, response, attempts + 1)

        } catch (error) {
            attempts += 1
            const hostname = error?.cause?.hostname || url

            if (attempts >= maxRetries) {
                // Determine the most descriptive error string
                let detailedError = error.message || error.name || "Unknown system exception";
                detailedError = detailedError.split('').map((c, i) => i === 0 ? c.toUpperCase() : c).join('')

                const hours = new Date().getHours()
                const isIngesting = (hours >= 6 && hours <= 9)

                if (hostname && String(hostname).includes('hpchatbot') && isIngesting) {
                    return {
                        raw: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                        status: true,
                        attempts,
                        message: `Ingest automation in progress`,
                        broadcastMessages: '[]'
                    }
                }

                // Final Failure Return
                return {
                    raw: JSON.stringify(error, Object.getOwnPropertyNames(error)),
                    status: false,
                    attempts, // Now tracking how many times we tried
                    message: `${detailedError} (Failed after ${attempts} attempts)`,
                    broadcastMessages: '[]'
                }
            }

            // Optional: Log the retry to the console for real-time monitoring
            console.log(`Retrying ${hostname}... (Attempt ${attempts}/${maxRetries})`);
        }
    }
}

const dumpDbAndCleanOldRecords = async () => {
    const config = await Config.findOne().exec()
    if (config && config._id) {
        const now = new Date().getTime()
        const lastDump = new Date(config.lastDump || new Date()).getTime()
        let dumped = false
        let errors = []

        // If no dump is made or more than 30 days has passed, then dump DB
        if (!config.lastDump || now - lastDump > (30 * 24 * 60 * 60 * 1000)) {
            const DBName = process.env.DB_NAME || 'downdowctordb'
            const targetPath = process.env.DB_DUMP_PATH || '/downdetector/'
            const dumpCommand = `mongodump --db ${DBName} --out ${targetPath}`

            console.log(' ')
            console.log('************ Dumping DB... ************')
            await exec(dumpCommand, (err, stdout, stderr) => {
                if (err) console.log(err)
                if (stderr) console.log(stderr)
                if (stdout) console.log(stdout)
            })
            await Config.updateOne(null, { lastDump: new Date() })
            dumped = true

            if (dumped) {
                const startDate = new Date()
                startDate.setDate(startDate.getDate() - 16)
                startDate.setHours(0, 0, 0, 0)
                const query = { createdAt: { $lte: startDate } }

                await AppLog.deleteMany(query).then(() => console.log('AppLogs cleaned successfully')).catch(err => errors.push(err))
                await Event.deleteMany(query).then(() => console.log('Events cleaned successfully')).catch(err => errors.push(err))
                await History.deleteMany(query).then(() => console.log('Histories cleaned successfully')).catch(err => errors.push(err))
                await UserAlert.deleteMany(query).then(() => console.log('UserAlerts cleaned successfully')).catch(err => errors.push(err))

                if (errors.length) {
                    console.log(' ')
                    console.log(`************ DB Cleaned with errors (${errors.length}) ************`)
                    errors.map((error, i) => `[${i + 1}]` + console.log(error))
                } else console.log(`************ DB Cleaned without errors ************`)
            }
        }
    }
}

const checkAllSystems = async () => {
    try {
        dumpDbAndCleanOldRecords()
        const systems = await System.find({ active: true }).select('-logo -raw').populate({ path: 'owners', select: '-password' })
        if (systems && systems.length) {
            let updatedCount = 0

            console.log(' ')
            console.log(' ')
            console.log(' ')
            console.log('************ Checking Systems ************')
            console.log(' ')
            const promises = systems.map(async (system, index) => {
                const {
                    _id,
                    name,
                    url,
                    description,
                    alertThreshold,
                    alertsExpiration,
                    owners,
                    emailDate,
                    emailedStatus
                } = system

                const { status, firstStatus, raw, broadcastMessages, message } = await checkSystemStatus(system)
                
                console.log(`[${index}] - ${name}`)

                const subscribers = await Subscription.find({ systemId: _id })

                let systemStatus = status
                let reportedlyDown = false
                const exists = await History.find({ systemId: _id }).select('-raw -message -description').sort({ createdAt: -1 })

                // Notifications variables
                const hasOwners = (Array.isArray(owners) && owners.length) || (Array.isArray(subscribers) && subscribers.length)
                const currentTime = new Date().getTime()
                const lastCheckedTime = new Date(exists[0] ? new Date(exists[0].createdAt || new Date()).getTime() : new Date()).getTime()
                const threeMinutesDown = currentTime - lastCheckedTime > 180000 && !exists[0].status
                const emailTime = emailDate ? new Date(emailDate).getTime() : null
                const hourFromLastEmail = emailedStatus || (emailTime ? currentTime - emailTime > 3600000 : true) || false // true if no email was sent (first timers)

                // Threshold logic
                const alerts = await UserAlert.find({ systemId: _id }).sort({ createdAt: -1 })
                if (alerts && Array.isArray(alerts) && alerts.length >= alertThreshold || 3) {
                    let count = 0
                    const users = []
                    alerts.forEach((alert, i) => {
                        const now = new Date().getTime()
                        const alertDate = new Date(alert.createdAt).getTime()

                        // Check if last alert is within the expiration date
                        if (i === 0 && now - alertDate < (3600000) * (alertsExpiration || 2)) {
                            if (!users.includes(alert.createdBy)) {
                                users.push(alert.createdBy)
                                count++
                            }
                            // Also check if time between alerts is less than 2 hours
                        } else if (i !== 0 && count === i && new Date(alerts[i - 1].createdAt).getTime() - alertDate < (3600000 * 2)) {
                            if (!users.includes(alert.createdBy)) {
                                users.push(alert.createdBy)
                                count++
                            }
                        }
                    })
                    if (count >= (alertThreshold || 3)) {
                        console.log(`------ ${name} reported DOWN with [${count}] reports ------`)
                        systemStatus = false
                        reportedlyDown = true
                    }
                }

                const downtimeArray = JSON.parse(broadcastMessages || '[]')
                if (exists && exists.length && exists[0]._id) {
                    // Current status is different from last check
                    if (systemStatus !== exists[0].status) {
                        updatedCount++

                        let newEmailDate = emailDate
                        let newEmailedStatus = emailedStatus === false || emailedStatus === true ? emailedStatus : null

                        if (name === 'TEST' || name === 'HP Report') {
                            console.log(' ')
                            console.log(' ')
                            console.log(' ---------- FLAG [1] ----------- ')
                            console.log('System: ', name)
                            console.log('Status: ', `${systemStatus ? '\x1b[32m' + 'UP' : '\x1b[31m' + 'DOWN'}\x1b[0m`)
                            console.log('lastCheckedTime: ', new Date(lastCheckedTime).toLocaleString())
                            console.log('lastCheckedStatus: ', `${exists[0].status ? '\x1b[32m' + 'UP' : '\x1b[31m' + 'DOWN'}\x1b[0m`)
                            console.log('threeMinutesDown: ', threeMinutesDown)
                            console.log('hourFromLastEmail :', hourFromLastEmail)
                            console.log('newEmailDate: ', newEmailDate ? new Date(newEmailDate).toLocaleString() : 'No Date')
                            console.log('newEmailedStatus: ', newEmailedStatus)
                            console.log('owners: ', owners.concat(subscribers || []).map(o => o.email).join(', '))
                            console.log(' ---------- FLAG [1] ----------- ')
                            console.log(' ')
                            console.log(' ')
                        }
                        if (hasOwners) {
                            // if DOWN -> threeMinutesDown must be true
                            //         -> newEmailedStatus must be true or null
                            //         -> hourFromLastEmail must be true
                            // if UP -> we send the email regardless of variables
                            if ((!systemStatus && threeMinutesDown && (newEmailedStatus || newEmailedStatus === null) && hourFromLastEmail)
                                || (systemStatus && emailedStatus === false)) {
                                await Promise.all(owners.concat(subscribers || []).map(owner => {
                                    console.log(' ')
                                    console.log(`########## Sending email to: `, owner.email)
                                    console.log(' ')

                                    const emailData = {
                                        ...system._doc,
                                        owner: owner.username,
                                        message,
                                        isSubscription: owner.isSubscription || false,
                                        subId: owner._id,
                                        email: owner.email || ''
                                    }
                                    sendEmail(
                                        { html: systemStatus ? systemUp(emailData) : systemDown(emailData) },
                                        owner.email,
                                        `${name} has been detected as ${systemStatus ? 'UP' : 'DOWN'}`
                                    )
                                    return AppLog.create({
                                        username: 'App',
                                        email: process.env.APP_EMAIL,
                                        details: `Sent ${systemStatus ? 'UP' : 'DOWN'}  notification for ${name} to: ${owner.email}.`,
                                        module: 'API'
                                    })
                                }))
                                newEmailDate = new Date()
                                newEmailedStatus = systemStatus
                            }
                        }

                        await System.findByIdAndUpdate(_id,
                            {
                                lastCheck: new Date(),
                                lastCheckStatus: systemStatus,
                                reportedlyDown,
                                raw,
                                broadcastMessages,
                                emailDate: newEmailDate,
                                emailedStatus: newEmailedStatus
                            },
                            { returnDocument: "after", useFindAndModify: false })

                        if (downtimeArray && downtimeArray.length) {
                            await Promise.all(downtimeArray.map(async (downtime) => {
                                if (downtime.active) {
                                    const exists = Event.findOne({
                                        start: downtime.starts_at,
                                        end: downtime.ends_at,
                                    }).exec()

                                    return !exists ? Event.create({
                                        systemId: _id,
                                        start: downtime.starts_at,
                                        end: downtime.ends_at,
                                        note: downtime.message,
                                        updatedBy: 'API'
                                    }) : null
                                } return null
                            }))
                        }

                        return await History.create({
                            systemId: _id,
                            url,
                            status: systemStatus,
                            description,
                            raw,
                            message
                        })
                    } else {
                        // Same status as last check

                        if (name === 'TEST' || name === 'HP Report') {
                            console.log(' ')
                            console.log(' ')
                            console.log(' ---------- FLAG [2] ----------- ')
                            console.log('System: ', name)
                            console.log('Status: ', `${systemStatus ? '\x1b[32m' + 'UP' : '\x1b[31m' + 'DOWN'}\x1b[0m`)
                            console.log('lastCheckedTime: ', new Date(lastCheckedTime).toLocaleString())
                            console.log('lastCheckedStatus: ', `${exists[0].status ? '\x1b[32m' + 'UP' : '\x1b[31m' + 'DOWN'}\x1b[0m`)
                            console.log('threeMinutesDown: ', threeMinutesDown)
                            console.log('hourFromLastEmail: ', hourFromLastEmail)
                            console.log('emailDate: ', emailDate ? new Date(emailDate).toLocaleString() : 'No Date')
                            console.log('emailTime: ', emailTime ? new Date(emailTime).toLocaleString() : 'No Date')
                            console.log('emailedStatus: ', emailedStatus)
                            console.log('owners: ', owners.concat(subscribers || []).map(o => o.email).join(', '))
                            console.log(' ---------- FLAG [2] ----------- ')
                            console.log(' ')
                            console.log(' ')
                        }
                        if (hasOwners) {
                            // System is DOWN and more than 3 minutes passed (if first time notifying) 
                            // or 5 minutes passed from last notification

                            // if DOWN -> hourFromLastEmail must be true
                            //         -> threeMinutesDown must be true
                            // if UP   -> we dont send anything
                            if (!systemStatus
                                && threeMinutesDown
                                && hourFromLastEmail) {
                                await Promise.all(owners.concat(subscribers || []).map(owner => {
                                    console.log(`########## Sending email to ##########`, owner.email)
                                    sendEmail(
                                        {
                                            html: systemDown({
                                                ...system._doc,
                                                owner: owner.username,
                                                message,
                                                isSubscription: owner.isSubscription || false,
                                                subId: owner._id,
                                                email: owner.email || ''
                                            })
                                        },
                                        owner.email,
                                        `${name} has been detected as down`
                                    )
                                    return AppLog.create({
                                        username: 'App',
                                        email: process.env.APP_EMAIL,
                                        details: `Sent DOWN  notification for ${name} to: ${owner.email}.`,
                                        module: 'API'
                                    })
                                }))
                                await System.findByIdAndUpdate(_id,
                                    {
                                        lastCheck: new Date(),
                                        lastCheckStatus: systemStatus,
                                        reportedlyDown,
                                        raw,
                                        emailDate: new Date(),
                                        emailedStatus: systemStatus
                                    },
                                    { returnDocument: "after", useFindAndModify: false })
                            }
                        }

                        // Check for banner or message on the system page
                        if (broadcastMessages && broadcastMessages !== '[]') {
                            await System.findByIdAndUpdate(_id,
                                {
                                    lastCheckStatus: systemStatus,
                                    reportedlyDown,
                                    raw,
                                    broadcastMessages
                                },
                                { returnDocument: "after", useFindAndModify: false })
                        }
                        if (downtimeArray && downtimeArray.length) {
                            await Promise.all(downtimeArray.map(async (downtime) => {
                                if (downtime.active) {
                                    const exists = Event.findOne({
                                        start: downtime.starts_at,
                                        end: downtime.ends_at,
                                    }).exec()

                                    return !exists ? Event.create({
                                        systemId: _id,
                                        start: downtime.starts_at,
                                        end: downtime.ends_at,
                                        note: downtime.message,
                                        updatedBy: 'API'
                                    }) : null
                                } return null
                            }))
                        }
                        return exists[0]
                    }
                } else {
                    // First time check, updating both system and history
                    await System.findByIdAndUpdate(system._id,
                        {
                            lastCheck: new Date(),
                            lastCheckStatus: systemStatus,
                            reportedlyDown,
                            raw,
                            broadcastMessages,
                            firstStatus
                        },
                        { returnDocument: "after", useFindAndModify: false })

                    if (downtimeArray && downtimeArray.length) {
                        await Promise.all(downtimeArray.map(async (downtime) => {
                            if (downtime.active) {
                                const exists = Event.findOne({
                                    start: downtime.starts_at,
                                    end: downtime.ends_at,
                                }).exec()

                                return !exists ? Event.create({
                                    systemId: _id,
                                    start: downtime.starts_at,
                                    end: downtime.ends_at,
                                    note: downtime.message,
                                    updatedBy: 'API'
                                }) : null
                            } return null
                        }))
                    }

                    return await History.create({
                        systemId: _id,
                        url,
                        status: systemStatus,
                        description,
                        raw,
                        message
                    })
                }
            })

            checkIndex = 1

            const updatedSystems = await Promise.all(promises)
            updatedSystems.forEach((updated, index) => {
                if (!updated) console.error(`Unable to update system status: ${systems[index].name}`)
            })
            console.log(' ')
            console.log(`[${new Date().toLocaleString()}] Checking completed. System status updated: ${updatedCount}`)
            console.log(' ')
            await updateChartDataCache(systems)
            // if (updatedCount) {
            //     await AppLog.create({
            //         username: 'App',
            //         email: process.env.APP_EMAIL,
            //         details: `Checked all systems. Updated: ${updatedCount}.`,
            //         module: 'API'
            //     })
            // }
        }
    } catch (error) {
        console.log(error)
    }
}

const runSystemCheckLoop = async (interval) => {
    try {
        clearInterval(intervalId)
        await checkAllSystems()
        intervalId = setInterval(async () => {
            try {
                await checkAllSystems()
            } catch (error) {
                console.error('Error in runSystemCheckLoop():', error)
            }
        }, interval || 60000) // 1 minute
    } catch (error) {
        console.error('Error in runSystemCheckLoop() [2]:', error)
    }
}

module.exports = {
    checkSystemStatus,
    checkAllSystems,
    runSystemCheckLoop,
    chartDataCache,
    buildChartDataForSystem
}