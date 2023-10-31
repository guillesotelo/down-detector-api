const express = require('express')
const { UserAlert } = require('../db/models')
const { verifyToken } = require('../helpers')
const router = express.Router()

//Get all UserAlerts
router.get('/getAll', async (req, res, next) => {
    try {
        const userAlerts = await UserAlert.find({ active: true }).sort({ createdAt: -1 })
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
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const newUserAlert = await UserAlert.create(req.body)
        if (!newUserAlert) return res.status(400).json('Error creating User Alert')

        res.status(200).json(newUserAlert)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update UserAlert data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        let userAlertData = { ...req.body }

        const updated = await UserAlert.findByIdAndUpdate(_id, userAlertData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating User Alert')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove UserAlert
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body

        await UserAlert.remove({ _id })

        res.status(200).json(`User Alert ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router