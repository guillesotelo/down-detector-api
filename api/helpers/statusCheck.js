const { System, History } = require("../db/models")
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
    if (systems && systems.length) {
        const promises = systems.map(async (system) => {
            const { status } = await checkApiStatus(system)
            const exists = await History.findOne({ systemId: system._id }).exec()
            if (exists && exists._id) {
                if (status !== exists.status) {
                    return await History.findByIdAndUpdate(
                        exists._id,
                        { status },
                        { returnDocument: "after", useFindAndModify: false }
                    )
                }
            } else return await History.create({ ...system._doc, systemId: system._id, status })
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