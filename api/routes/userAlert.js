const express = require('express')
const { UserAlert, AppLog } = require('../db/models')
const { verifyToken } = require('../helpers')
const router = express.Router()

//Get all UserAlerts
router.get('/getAll', async (req, res, next) => {
    try {
        const { systemId } = req.query
        const userAlerts = systemId ?
            await UserAlert.find({ systemId }).sort({ createdAt: -1 }) :
            await UserAlert.find().sort({ createdAt: -1 })
        if (!userAlerts) return res.status(404).send('No User Alerts found')

        res.status(200).json(userAlerts)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get UserAlert by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const userAlert = await UserAlert.findById(_id)
        if (!userAlert) return res.status(404).send('User Alert not found')

        res.status(200).json(userAlert)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Create new UserAlert
router.post('/create', async (req, res, next) => {
    try {
        const { createdBy, url, systemId, user } = req.body
        const newUserAlert = await UserAlert.create(req.body)
        if (!newUserAlert) return res.status(400).json('Error creating User Alert')

        await AppLog.create({
            username: user.username || 'anonymous',
            email: user.username || 'anonymous',
            details: `Alert created: ${url} - System: ${systemId}`,
            module: 'User Alert'
        })

        res.status(200).json(newUserAlert)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update UserAlert data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, user } = req.body
        let userAlertData = { ...req.body }

        const updated = await UserAlert.findByIdAndUpdate(_id, userAlertData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating User Alert')

        await AppLog.create({
            username: user.username || 'anonymous',
            email: user.username || 'anonymous',
            details: `Alert updated: ${updated.url} - System: ${updated.systemId}`,
            module: 'User Alert'
        })

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove UserAlert
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id, user } = req.body
        const alert = await UserAlert.findById(_id)

        await UserAlert.deleteOne({ _id })
        
        await AppLog.create({
            username: user.username || '',
            email: user.username || '',
            details: `Alert removed: ${alert.url} - System: ${alert.systemId}`,
            module: 'User Alert'
        })

        res.status(200).json(`User Alert ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router