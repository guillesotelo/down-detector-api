const express = require('express')
const { Event } = require('../db/models')
const { verifyToken } = require('../helpers')
const router = express.Router()

//Get all events
router.get('/getAll', async (req, res, next) => {
    try {
        const events = await Event.find().sort({ createdAt: -1 })
        if (!events) return res.status(404).send('No events found')

        res.status(200).json(events)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get Event by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const event = await Event.findById(_id)
        if (!event) return res.status(404).send('Event not found')

        res.status(200).json(event)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Create new Event
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const newEvent = await Event.create(req.body)
        if (!newEvent) return res.status(400).json('Error creating event')

        res.status(200).json(newEvent)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update Event data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        let eventData = { ...req.body }

        const updated = await Event.findByIdAndUpdate(_id, eventData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(404).send('Error updating event')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove Event
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body

        await Event.remove({ _id })

        res.status(200).json(`Event ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router