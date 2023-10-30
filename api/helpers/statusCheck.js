const { System } = require("../db/models")
let isSystemCheckRunning = false

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
    if (systems && Array.isArray(systems) && systems.length) {
        const promises = systems.map(async (system) => {
            const status = await checkApiStatus(system)
            if (status.status !== system.status) {
                return System.findByIdAndUpdate(
                    system._id,
                    { status },
                    { returnDocument: "after", useFindAndModify: false }
                )
            }
        })

        const updatedSystems = await Promise.all(promises)
        updatedSystems.forEach((updated, index) => {
            if (!updated) console.error(`Unable to update system status: ${JSON.stringify(systems[index])}`)
        })
        console.log('System Check Loop finished.')
    }
}

const runSystemCheckLoop = async (interval) => {
    if (isSystemCheckRunning) return
    isSystemCheckRunning = true

    try {
        await checkAllSystems()
    } catch (error) {
        console.error('Error running system check:', error)
    } finally {
        isSystemCheckRunning = false
    }

    setTimeout(runSystemCheckLoop, interval || 600000)
}

module.exports = {
    checkApiStatus,
    checkAllSystems,
    runSystemCheckLoop
}