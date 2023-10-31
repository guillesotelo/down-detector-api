const express = require('express')
const { System, Event } = require('../db/models')
const { verifyToken } = require('../helpers')
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

        if (downtimeArray && downtimeArray.length) {
            const promises = downtimeArray.map(async (downtime) => {
                return await Event.create({ ...downtime, systemId: newSystem._id })
            })

            const savedSystems = await Promise.all(promises)
            savedSystems.forEach((updated, index) => {
                if (!updated) console.error(`Unable to save system: ${JSON.stringify(downtimeArray[index])}`)
            })
        }

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

        await System.remove({ _id })

        res.status(200).json(`System ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router