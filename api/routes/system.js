const express = require('express')
const { System, Event, History, AppLog } = require('../db/models')
const { verifyToken } = require('../helpers')
const { checkApiStatus } = require('../helpers/statusCheck')
const router = express.Router()

//Get all systems
router.get('/getAll', async (req, res, next) => {
    try {
        const systems = await System.find({ active: true }).sort({ createdAt: -1 })
        if (!systems) return res.status(404).send('No systems found')

        res.status(200).json(systems)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get system by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const system = await System.findById(_id)
        if (!system) return res.status(404).send('System not found')

        res.status(200).json(system)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Create new system
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const { downtimeArray } = req.body
        const newSystem = await System.create(req.body)
        if (!newSystem) return res.status(400).json('Error creating system')

        await AppLog.create({
            username: newSystem.createdBy || '',
            email: 'down@company.com',
            details: `System created: ${newSystem.name} - ${newSystem.url}`,
            module: 'System'
        })

        if (downtimeArray && downtimeArray.length) {
            const promises = downtimeArray.map(async (downtime) => {
                return await Event.create({ ...downtime, systemId: newSystem._id })
            })

            const savedSystems = await Promise.all(promises)
            savedSystems.forEach((updated, index) => {
                if (!updated) console.error(`Unable to save downtime data: ${JSON.stringify(downtimeArray[index])}`)
            })
        }

        const { status } = await checkApiStatus(newSystem)
        await History.create({ ...newSystem._doc, systemId: newSystem._id, status })

        res.status(200).json(newSystem)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update system data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, downtimeArray } = req.body
        let systemData = { ...req.body }

        const updated = await System.findByIdAndUpdate(_id, systemData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating system')

        await AppLog.create({
            username: updated.createdBy || '',
            email: 'down@company.com',
            details: `System updated: ${updated.name} - ${updated.url}`,
            module: 'System'
        })

        if (downtimeArray && downtimeArray.length) {
            const promises = downtimeArray.map(async (downtime) => {
                return downtime._id ?
                    await Event.findByIdAndUpdate(downtime._id, downtime, { returnDocument: "after", useFindAndModify: false }) :
                    await Event.create({ ...downtime, systemId: updated._id })
            })

            const savedSystems = await Promise.all(promises)
            savedSystems.forEach((updated, index) => {
                if (!updated) console.error(`Unable to save system: ${JSON.stringify(downtimeArray[index])}`)
            })
        }

        const { status } = await checkApiStatus(updated)
        const exists = await History.find({ systemId: updated._id }).sort({ createdAt: -1 })
        if (exists && exists.length && exists[0]._id) {
            if (status !== exists[0].status) {
                await History.create({
                    systemId: updated._id,
                    url: updated.url,
                    status,
                    description: updated.description
                })
            }
        }

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove system
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        const _system = await System.findById(_id)

        await System.remove({ _id })

        await AppLog.create({
            username: _system.createdBy || '',
            email: 'down@company.com',
            details: `System removed: ${_system.name} - ${_system.url}`,
            module: 'System'
        })

        res.status(200).json(`System ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router