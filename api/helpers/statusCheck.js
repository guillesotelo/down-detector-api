const { System, History, AppLog } = require("../db/models")
let intervalId = null

const checkApiStatus = async (system) => {
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
                message: `Error while fetching API: ${error.message}`
            }
        }
    } catch (error) {
        return {
            status: false,
            message: `Error while fetching API: ${error.message}`
        }
    }
}

const checkAllSystems = async () => {
    const systems = await System.find({ active: true })
    if (systems && systems.length) {
        let updatedCount = 0

        // ADD REPORT THREESHOLD LOGIC

        const promises = systems.map(async (system) => {
            const { status } = await checkApiStatus(system)
            const exists = await History.find({ systemId: system._id }).sort({ createdAt: -1 })
            await System.findByIdAndUpdate(system._id, { lastCheck: new Date(), lastCheckStatus: status }, { returnDocument: "after", useFindAndModify: false })

            if (exists && exists.length && exists[0]._id) {
                if (status !== exists[0].status) {
                    updatedCount++
                    return await History.create({
                        systemId: system._id,
                        url: system.url,
                        status,
                        description: system.description
                    })
                } else return exists[0]
            } else return await History.create({
                systemId: system._id,
                url: system.url,
                status,
                description: system.description
            })
        })

        const updatedSystems = await Promise.all(promises)
        updatedSystems.forEach((updated, index) => {
            if (!updated) console.error(`Unable to update system status: ${systems[index].name}`)
        })
        console.log(`[${new Date().toLocaleString()}] System status updated: ${updatedCount}`)
        await AppLog.create({
            username: 'App',
            email: 'down@company.com',
            details: `Checked all systems. ${updatedCount ? `Updated: ${updatedCount}.` : 'No updates.'}`,
            module: 'API'
        })
    }
}

const runSystemCheckLoop = async (interval) => {
    try {
        await checkAllSystems()
        intervalId = setInterval(checkAllSystems, interval || 600000)
    } catch (error) {
        console.error('Error running system check:', error)
    }
}

module.exports = {
    checkApiStatus,
    checkAllSystems,
    runSystemCheckLoop
}