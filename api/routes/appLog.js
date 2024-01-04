const express = require('express')
const { AppLog } = require('../db/models')
const { verifyToken } = require('../helpers')
const router = express.Router()

//Get all appLogs
router.get('/getAll', verifyToken, async (req, res, next) => {
    try {
        const appLogs = await AppLog.find().sort({ createdAt: -1 })
        if (!appLogs || !appLogs.length) return res.status(404).send('No App Logs found')

        res.status(200).json(appLogs)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get AppLog by ID
router.get('/getById', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.query
        const appLog = await AppLog.findById(_id)
        if (!appLog) return res.status(404).send('App Log not found')

        res.status(200).json(appLog)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Create new AppLog
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const newAppLog = await AppLog.create(req.body)
        if (!newAppLog) return res.status(400).json('Error creating App Log')

        res.status(200).json(newAppLog)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update AppLog data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        let appLogData = { ...req.body }

        const updated = await AppLog.findByIdAndUpdate(_id, appLogData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating App Log')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove AppLog
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body

        await AppLog.deleteOne({ _id })

        res.status(200).json(`App Log ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router