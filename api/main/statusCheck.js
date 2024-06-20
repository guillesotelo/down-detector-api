const { exec } = require("child_process")
const dotenv = require('dotenv')
dotenv.config()
const { isValidUrl } = require("../helpers")
const { System, History, AppLog, UserAlert, Event, Config } = require("../db/models")
const { sendEmail } = require("../mailer")
const { systemDown, systemUp } = require("../mailer/emailTemplates")
let intervalId = null
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
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
let checkIndex = 1

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
            newBroadcast = await getBroadcastedMessages('https://confluence.company.biz/')
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
        else if (systemName.includes('gitlab')) {
            newBroadcast = await getBroadcastedMessages('https://gitlab.cm.company.biz/api/v4/broadcast_messages')
            if (stringJsonResponse.split('ok').length && stringJsonResponse.split('ok').length >= 16) {
                return {
                    broadcastMessages: newBroadcast,
                    raw: stringJsonResponse,
                    status: true,
                    message: `System up and running`
                }
            }
        }
        else if (systemName.includes('gerrit')) {
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
        return {
            raw: String(error),
            status: false,
            message: `Unexpected error: ${error}`,
            firstStatus: false
        }
    }
}

const checkSystemStatus = async (system) => {
    try {
        const { url, timeout, name, broadcastMessages } = system

        if (!isValidUrl(url)) {
            return {
                raw: '{}',
                status: false,
                message: `URL not valid: "${url}"`,
                broadcastMessages: broadcastMessages || '[]'
            }
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout || 10000)
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        console.log(`[${checkIndex}]`, name)
        checkIndex += 1

        return getSystemStatus(system, response)
    } catch (error) {
        console.log(error)
        return {
            raw: JSON.stringify(error),
            status: false,
            message: `Unexpected error: ${error}`,
            broadcastMessages: '[]'
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
            console.log('************ Checking systems ************')
            const promises = systems.map(async (system) => {
                const {
                    _id,
                    name,
                    url,
                    description,
                    alertThreshold,
                    alertsExpiration,
                    owners,
                    emailDate,
                    emailStatus
                } = system

                const { status, firstStatus, raw, broadcastMessages, message } = await checkSystemStatus(system)

                let systemStatus = status
                let reportedlyDown = false
                const exists = await History.find({ systemId: _id }).select('-raw -message -description').sort({ createdAt: -1 })

                // Notifications variables
                const hasOwners = Array.isArray(owners) && owners.length
                const lastCheckedTime = new Date(exists[0] ? exists[0].createdAt : new Date()).getTime()
                const currentTime = new Date().getTime()
                const emailTime = emailDate ? new Date(emailDate).getTime() : null
                const afterThreeMinutes = currentTime - lastCheckedTime > 180000
                const halfHourFromLastEmail = emailTime ? currentTime - emailTime > 1800000 : true
                const timePassedFromDown = emailTime ? Math.floor((currentTime - lastCheckedTime) / 1000 / 60) : null

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
                        let newEmailStatus = emailStatus

                        if (hasOwners
                            && process.env.NODE_ENV === 'production'
                        ) {
                            // System is UP and it was prevoisly notified as DOWN
                            if (systemStatus && emailDate && !emailStatus) {
                                await Promise.all(owners.map(owner => {
                                    if (owner.username.toLowerCase().includes('zhou')) return null
                                    sendEmail(
                                        { html: systemUp({ ...system._doc, owner: owner.username, message }) },
                                        owner.email,
                                        `${name} has been detected as up`
                                    )
                                    return AppLog.create({
                                        username: 'App',
                                        email: 'hpdevp@company.com',
                                        details: `Sent UP notification to: ${owner.email}.`,
                                        module: 'API'
                                    })
                                }))
                                newEmailDate = new Date()
                                newEmailStatus = systemStatus
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
                                emailStatus: newEmailStatus
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

                        if (hasOwners
                            && process.env.NODE_ENV === 'production'
                        ) {

                            // System is DOWN and more than 3 minutes passed (if first time notifying) 
                            // or 5 minutes passed from last notification
                            if (!systemStatus
                                && afterThreeMinutes
                                && halfHourFromLastEmail
                            ) {
                                await Promise.all(owners.map(owner => {
                                    if (owner.username.toLowerCase().includes('zhou')) return null
                                    sendEmail(
                                        { html: systemDown({ ...system._doc, owner: owner.username, message, timePassedFromDown }) },
                                        owner.email,
                                        `${name} has been detected as down`
                                    )
                                    return AppLog.create({
                                        username: 'App',
                                        email: 'hpdevp@company.com',
                                        details: `Sent DOWN notification to: ${owner.email}.`,
                                        module: 'API'
                                    })
                                }))
                                await System.findByIdAndUpdate(_id,
                                    { emailDate: new Date(), emailStatus: systemStatus },
                                    { returnDocument: "after", useFindAndModify: false })
                            }
                        }

                        // Check for banner or message on the system page
                        if (broadcastMessages && broadcastMessages !== '[]') {
                            await System.findByIdAndUpdate(_id,
                                {
                                    lastCheck: new Date(),
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
            console.log(`[${new Date().toLocaleString()}] System status updated: ${updatedCount}`)
            // if (updatedCount) {
            //     await AppLog.create({
            //         username: 'App',
            //         email: 'hpdevp@company.com',
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
        intervalId = setInterval(checkAllSystems, interval || 600000)
    } catch (error) {
        console.error('Error running system check:', error)
    }
}

module.exports = {
    checkSystemStatus,
    checkAllSystems,
    runSystemCheckLoop
}