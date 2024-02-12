const express = require('express')
const { History, AppLog } = require('../db/models')
const { verifyToken } = require('../helpers')
const router = express.Router()
const moment = require('moment')

//Get all histories
router.get('/getAll', async (req, res, next) => {
    try {
        const { systemId } = req.query
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 15)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date()

        const query = systemId ? { systemId } : { createdAt: { $gte: startDate, $lte: endDate } }

        const histories = await History.find(query).limit(300).sort({ createdAt: -1 })
        if (!histories || !histories.length) return res.status(200).send('No histories found')

        res.status(200).json(histories)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get History by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const history = await History.findById(_id)
        if (!history) return res.status(404).send('History not found')

        res.status(200).json(history)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get History by systemId
router.get('/getBySystemId', async (req, res, next) => {
    try {
        const { _id } = req.query
        const history = await History.find({ systemId: _id }).sort({ createdAt: -1 })
        if (!history || !history.length) return res.status(404).send('History not found for given system')

        res.status(200).json(history)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Create new History
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const newHistory = await History.create(req.body)
        if (!newHistory) return res.status(400).json('Error creating history')

        await AppLog.create({
            username: 'App',
            email: 'hpdevp@company.com',
            details: `History created: ${newHistory.url} - Status: ${newHistory.status ? 'UP' : 'DOWN'} - System: ${updated.systemId}`,
            module: 'History'
        })

        res.status(201).json(newHistory)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update History data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, user } = req.body
        let historyData = { ...req.body }

        const updated = await History.findByIdAndUpdate(_id, historyData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(400).send('Error updating History')

        await AppLog.create({
            username: 'App',
            email: 'hpdevp@company.com',
            details: `History updated: ${updated.url} - Status: ${updated.status ? 'UP' : 'DOWN'} - System: ${updated.systemId}`,
            module: 'History'
        })

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove History
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        const history = await History.findById(_id)
        await History.deleteOne({ _id })

        await AppLog.create({
            username: 'App',
            email: 'hpdevp@company.com',
            details: `History removed: ${history.url} - System: ${history.systemId}`,
            module: 'History'
        })

        res.status(200).json(`History ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router