const express = require('express')
const { Subscription, AppLog } = require('../db/models')
const { verifyToken } = require('../helpers')
const { runSystemCheckLoop } = require('../main/statusCheck')
const router = express.Router()

//Get all subscriptions
router.get('/getAll', async (req, res, next) => {
    try {
        const { systemId } = req.query
        const subscriptions = systemId ?
            await Subscription.find({ systemId }).sort({ createdAt: -1 }) :
            await Subscription.find().sort({ createdAt: -1 })
        if (!subscriptions || !subscriptions.length) return res.status(200).send('No Subscriptions found')

        res.status(200).json(subscriptions)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get subscription by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const subscription = await Subscription.findById(_id)
        if (!subscription) return res.status(404).send('Subscription not found')

        res.status(200).json(subscription)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Create new subscription
router.post('/create', async (req, res, next) => {
    try {
        const { username, email, name, user } = req.body
        const newsubScription = await Subscription.create(req.body)
        if (!newsubScription) return res.status(400).json('Error creating Subscription')

            await runSystemCheckLoop()

        await AppLog.create({
            username: user.username || username,
            email: user.email || email,
            details: `New subscription for: ${name || url || ''}`,
            module: 'Subscription'
        })

        res.status(201).json(newsubScription)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update subscription data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, user } = req.body
        let subscriptionData = { ...req.body }

        const updated = await Subscription.findByIdAndUpdate(_id, subscriptionData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(400).send('Error updating Subscription')

        await AppLog.create({
            username: user.username || updated.username || 'anonymous',
            email: user.username || updated.email || 'anonymous',
            details: `Subscription updated: ${updated.createdBy} - System: ${updated.systemId}`,
            module: 'Subscription'
        })

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove subscription
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id, systemId, user } = req.body
        const subscription = await Subscription.findById(_id)

        await Subscription.deleteOne({ _id, systemId })

        await AppLog.create({
            username: user.username || subscription.username || 'anonymous',
            email: user.username || subscription.email || 'anonymous',
            details: `Subscription deleted: ${subscription.email} - System: ${subscription.systemId}`,
            module: 'Subscription'
        })

        res.status(200).json(`Subscription ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router