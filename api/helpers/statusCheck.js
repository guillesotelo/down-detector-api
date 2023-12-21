const { System, History, AppLog, UserAlert } = require("../db/models")
let intervalId = null

const checkSystemStatus = async (system) => {
    try {
        const { url, timeout } = system
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout || 10000)
        const response = await fetch(url, { signal: controller.signal })
        clearTimeout(timeoutId)

        if (response.status === 200) {
            return {
                status: true,
                message: `API up and running`
            }
        } else {
            return {
                status: false,
                message: `Error fetching system: ${error.message}`
            }
        }
    } catch (error) {
        return {
            status: false,
            message: `Error fetching system: ${error.message}`
        }
    }
}

const checkAllSystems = async () => {
    const systems = await System.find({ active: true })
    if (systems && systems.length) {
        let updatedCount = 0

        const promises = systems.map(async (system) => {
            const { status } = await checkSystemStatus(system)
            let systemStatus = status
            const exists = await History.find({ systemId: system._id }).sort({ createdAt: -1 })

            // Threshold logic
            let alertStatus = null
            const alerts = await UserAlert.find({ systemId: system._id }).sort({ createdAt: -1 })
            if (alerts && Array.isArray(alerts) && alerts.length >= system.alertThreshold || 3) {
                let count = 0
                alerts.forEach((alert, i) => {
                    const now = new Date().getTime()
                    const alertDate = new Date(alert.createdAt).getTime()

                    // Check if last alert is within the expiration date
                    if (i === 0 && now - alertDate < (3600000) * (system.alertsExpiration || 2)) {
                        count++
                        // Also check if time between alerts is less than 2 hours
                    } else if (i !== 0 && count > 0 && new Date(alerts[i - 1].createdAt).getTime() - alertDate < (3600000 * 2)) {
                        count++
                    }
                })
                if (count >= 3) systemStatus = false
            }

            await System.findByIdAndUpdate(system._id,
                {
                    lastCheck: new Date(),
                    lastCheckStatus: systemStatus
                },
                { returnDocument: "after", useFindAndModify: false })


            if (exists && exists.length && exists[0]._id) {
                if (systemStatus !== exists[0].status) {
                    updatedCount++
                    return await History.create({
                        systemId: system._id,
                        url: system.url,
                        status: systemStatus,
                        description: system.description
                    })
                } else return exists[0]
            } else return await History.create({
                systemId: system._id,
                url: system.url,
                status: systemStatus,
                description: system.description
            })
        })

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