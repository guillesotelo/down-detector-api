const { System, History, AppLog, UserAlert } = require("../db/models")
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
            message: `API up and running`
        }
    }
    return {
        raw: stringJson,
        status: false,
        message: `Error while checking system: ${system.name}`
    }
}

const getSystemStatus = async (system, response) => {
    try {
        const { name } = system
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
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
            const textResponse = await response.text()
            const jsonpPrefix = ')]}\''
            if (textResponse.startsWith(jsonpPrefix)) {
                const jsonpBody = textResponse.slice(jsonpPrefix.length)
                jsonResponse = JSON.parse(jsonpBody)
            } else jsonResponse = JSON.parse(textResponse)
        } else jsonResponse = await response.text()

        const stringJsonResponse = JSON.stringify(jsonResponse)

        if (isInternal) {
            if (systemName.includes('vira') || systemName.includes('confluence')) {
                if (jsonResponse.state && jsonResponse.state === 'RUNNING') {
                    return {
                        raw: stringJsonResponse,
                        status: true,
                        message: `API up and running`
                    }
                }
            }
            else if (systemName.includes('artifactory')) {
                if (jsonResponse.code && jsonResponse.code === 'OK') {
                    return {
                        raw: stringJsonResponse,
                        status: true,
                        message: `API up and running`
                    }
                }
            }
            else if (systemName.includes('gitlab')) {
                if (stringJsonResponse.split('ok').length && stringJsonResponse.split('ok').length >= 16) {
                    return {
                        raw: stringJsonResponse,
                        status: true,
                        message: `API up and running`
                    }
                }
            }
            else if (systemName.includes('gerrit')) {
                if (jsonResponse.gerrit) {
                    return {
                        raw: stringJsonResponse,
                        status: true,
                        message: `API up and running`
                    }
                }
            }
            else if (systemName.includes('victoria')) {
                if (jsonResponse.length && jsonResponse.length > 10000) {
                    return {
                        raw: stringJsonResponse,
                        status: true,
                        message: `API up and running`
                    }
                }
            }
            else if (systemName.includes('zuul')) return checkZuulStatus(system, jsonResponse)
        }

        else if (response.ok) {
            return {
                raw: stringJsonResponse,
                status: true,
                message: `API up and running`
            }
        }
        return {
            raw: stringJsonResponse,
            status: false,
            message: `Error while checking system: ${name}`
        }

    } catch (error) {
        console.log(error)
        return {
            raw: String(error),
            status: false,
            message: `An unexpected error occurred: ${error}`
        }
    }
}

const checkSystemStatus = async (system) => {
    try {
        const { url, timeout, name } = system
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
            message: `Unexpected error occurred: ${error}`
        }
    }
}

const checkAllSystems = async () => {
    const systems = await System.find({ active: true })
    if (systems && systems.length) {
        let updatedCount = 0

        console.log('# # # # Checking systems # # # #')
        const promises = systems.map(async (system) => {
            const { status, raw } = await checkSystemStatus(system)

            let systemStatus = status
            let reportedlyDown = false
            const exists = await History.find({ systemId: system._id }).sort({ createdAt: -1 })

            // Threshold logic
            let alertStatus = null
            const alerts = await UserAlert.find({ systemId: system._id }).sort({ createdAt: -1 })
            if (alerts && Array.isArray(alerts) && alerts.length >= system.alertThreshold || 3) {
                let count = 0
                const users = []
                alerts.forEach((alert, i) => {
                    const now = new Date().getTime()
                    const alertDate = new Date(alert.createdAt).getTime()

                    // Check if last alert is within the expiration date
                    if (i === 0 && now - alertDate < (3600000) * (system.alertsExpiration || 2)) {
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
                if (count >= 3) {

                    console.log(`------ ${system.name} reported DOWN with [${count}] reports ------`)
                    systemStatus = false
                    reportedlyDown = true
                }
            }



            if (exists && exists.length && exists[0]._id) {
                if (systemStatus !== exists[0].status) {
                    updatedCount++
                    await System.findByIdAndUpdate(system._id,
                        {
                            lastCheck: new Date(),
                            lastCheckStatus: systemStatus,
                            reportedlyDown,
                            raw
                        },
                        { returnDocument: "after", useFindAndModify: false })

                    return await History.create({
                        systemId: system._id,
                        url: system.url,
                        status: systemStatus,
                        description: system.description,
                        raw
                    })
                } else return exists[0]
            } else {
                await System.findByIdAndUpdate(system._id,
                    {
                        lastCheck: new Date(),
                        lastCheckStatus: systemStatus,
                        reportedlyDown,
                        raw
                    },
                    { returnDocument: "after", useFindAndModify: false })

                return await History.create({
                    systemId: system._id,
                    url: system.url,
                    status: systemStatus,
                    description: system.description,
                    raw
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