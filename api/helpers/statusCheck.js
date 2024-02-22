const { isValidUrl } = require(".")
const { System, History, AppLog, UserAlert, Event } = require("../db/models")
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
        const internalSystems = [
            'vira',
            'confluence',
            'artifactory',
            'gitlab',
            'zuul',
            'gerrit',
            'victoria'
        ]
        const isInternal = internalSystems.filter(intName => systemName.includes(intName)).length

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

        if (isInternal) {
            if (systemName.includes('vira') || systemName.includes('confluence')) {
                if (jsonResponse.state && jsonResponse.state === 'RUNNING') {
                    return {
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
            else if (systemName.includes('victoria')) {
                if (jsonResponse.length && jsonResponse.length > 10000) {
                    return {
                        raw: stringJsonResponse,
                        status: true,
                        message: `System up and running`
                    }
                }
            }
            else if (systemName.includes('zuul')) return checkZuulStatus(system, jsonResponse)
        }

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

const checkAllSystems = async () => {
    const systems = await System.find({ active: true })
    if (systems && systems.length) {
        let updatedCount = 0

        console.log('# # # # Checking systems # # # #')
        const promises = systems.map(async (system) => {
            const { _id, name, url, description, alertThreshold, alertsExpiration } = system
            const { status, firstStatus, raw, broadcastMessages, message } = await checkSystemStatus(system)

            let systemStatus = status
            let reportedlyDown = false
            const exists = await History.find({ systemId: _id }).sort({ createdAt: -1 })

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
                    await System.findByIdAndUpdate(_id,
                        {
                            lastCheck: new Date(),
                            lastCheckStatus: systemStatus,
                            reportedlyDown,
                            raw,
                            broadcastMessages
                        },
                        { returnDocument: "after", useFindAndModify: false })

                    if (downtimeArray && downtimeArray.length) {
                        await Promise.all(downtimeArray.map(async (downtime) => {
                            if (downtime.active) {
                                return Event.create({
                                    systemId: _id,
                                    start: downtime.starts_at,
                                    end: downtime.ends_at,
                                    note: downtime.message,
                                    updatedBy: 'API'
                                })
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
                    // Same status, check for banner or message on the system page
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
                                return Event.create({
                                    systemId: _id,
                                    start: downtime.starts_at,
                                    end: downtime.ends_at,
                                    note: downtime.message,
                                    updatedBy: 'API'
                                })
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
                            return Event.create({
                                systemId: _id,
                                start: downtime.starts_at,
                                end: downtime.ends_at,
                                note: downtime.message,
                                updatedBy: 'API'
                            })
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
        if (updatedCount) {
            await AppLog.create({
                username: 'App',
                email: 'hpdevp@company.com',
                details: `Checked all systems. Updated: ${updatedCount}.`,
                module: 'API'
            })
        }
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