const express = require('express')
const { System, Event, History, AppLog, User } = require('../db/models')
const { verifyToken } = require('../helpers')
const { checkSystemStatus } = require('../helpers/statusCheck')
const router = express.Router()

//Get all systems
router.get('/getAll', async (req, res, next) => {
    try {
        const { _id } = req.query
        const user = await User.findById(_id)

        const systems = user && user.isSuper ?
            await System.find({ active: true }).sort({ createdAt: -1 }).populate('owners')
            : await System.find({ active: true }).sort({ createdAt: -1 })
        if (!systems || !systems.length) return res.status(404).send('No systems found')

        res.status(200).json(systems)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get system by ID
router.get('/getAllByOwnerId', async (req, res, next) => {
    try {
        const { _id } = req.query
        const systems = await System.find({ 'owners.user': _id }).sort({ createdAt: -1 })
        if (!systems || !systems.length) return res.status(404).send('No systems found')

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
        const { downtimeArray, user, selectedOwners } = req.body
        const ownerIds = selectedOwners.map(owner => owner._id)

        const newSystem = await System.create({
            ...req.body,
            owners: ownerIds
        })
        if (!newSystem) return res.status(400).json('Error creating system')

        // Many to many relations User-System
        await User.updateMany(
            { _id: { $in: ownerIds } },
            { $addToSet: { systems: newSystem._id } }
        )

        if (downtimeArray && downtimeArray.length) {
            const savedSystems = await Promise.all(downtimeArray.map(async (downtime) =>
                Event.create({ ...downtime, systemId: newSystem._id })
            ))
            savedSystems.forEach((updated, index) => {
                if (!updated) console.error(`Unable to save downtime data: ${JSON.stringify(downtimeArray[index])}`)
            })
        }

        const { status } = await checkSystemStatus(newSystem)
        await History.create({ ...newSystem._doc, systemId: newSystem._id, status })

        await AppLog.create({
            username: user.username || '',
            email: user.email || '',
            details: `System created: ${newSystem.name} - ${newSystem.url}`,
            module: 'System'
        })

        res.status(200).json(newSystem)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update system data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, downtimeArray, user, selectedOwners } = req.body
        let systemData = { ...req.body }

        if (selectedOwners && Array.isArray(selectedOwners) && selectedOwners.length) {
            systemData.owners = selectedOwners.map(user => user._id)
        }

        const updatedSystem = await System.findByIdAndUpdate(
            _id,
            systemData,
            { returnDocument: "after", useFindAndModify: false }
        ).populate('owners')

        if (!updatedSystem) return res.status(404).send('Error updating system')

        if (systemData.owners && systemData.owners.length) {
            await User.updateMany(
                { _id: { $in: systemData.owners } },
                { $addToSet: { systems: _id } }
            )
            await User.updateMany(
                { systems: _id, _id: { $nin: systemData.owners } },
                { $pull: { systems: _id } }
            )
        }

        if (downtimeArray && downtimeArray.length) {
            const savedEvents = await Promise.all(downtimeArray.map(async (downtime) =>
                downtime._id ?
                    Event.findByIdAndUpdate(downtime._id, downtime, { returnDocument: "after", useFindAndModify: false }) :
                    Event.create({ ...downtime, systemId: updatedSystem._id })
            ))
            savedEvents.forEach((updatedSystem, index) => {
                if (!updatedSystem) console.error(`Unable to save event: ${JSON.stringify(downtimeArray[index])}`)
            })
        }

        const { status } = await checkSystemStatus(updatedSystem)
        const exists = await History.find({ systemId: updatedSystem._id }).sort({ createdAt: -1 })
        if (exists && exists.length && exists[0]._id) {
            if (status !== exists[0].status) {
                await History.create({
                    systemId: updatedSystem._id,
                    url: updatedSystem.url,
                    status,
                    description: updatedSystem.description
                })
            }
        }

        await AppLog.create({
            username: user.username || '',
            email: user.email || '',
            details: `System updated: ${updatedSystem.name} - ${updatedSystem.url}`,
            module: 'System'
        })

        const populatedSystem = await System.findById(updatedSystem._id).populate('owners')

        res.status(200).json(populatedSystem)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove system
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id, user, name, url } = req.body

        const _system = await System.findById(_id)
        if (!_system) return res.status(404).send('Error deleting system')

        await User.updateMany(
            { systems: _id },
            { $pull: { systems: _id } }
        )

        const removed = await System.deleteOne({ _id })

        await AppLog.create({
            username: user.username || '',
            email: user.email || '',
            details: `System removed: ${name} - ${url}`,
            module: 'System'
        })
        if (!removed) return res.status(404).send('Error deleting system')

        res.status(200).json(`System ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router