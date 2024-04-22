const express = require('express')
const { Config } = require('../db/models')
const { verifyToken } = require('../helpers')
const router = express.Router()
const fs = require('fs')
require('dotenv').config();

//Get all configs
router.get('/getAll', verifyToken, async (req, res, next) => {
    try {
        const configs = await Config.find().sort({ createdAt: -1 })
        if (!configs || !configs.length) return res.status(200).send('No Configs found')

        res.status(200).json(configs)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get config by ID
router.get('/getById', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.query
        const config = await Config.findById(_id)
        if (!config) return res.status(404).send('Config not found')

        res.status(200).json(config)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get version date
router.get('/getVersionDate', async (req, res, next) => {
    try {
        const filePath = process.env.NODE_ENV !== 'production' ?
            '/home/guillermo/Documents/git/down-detector/src/constants/app.ts'
            : '/downdetector/client/build/index.html'

        const dateCreated = fs.statSync(filePath).mtime
        const vDate = dateCreated ? new Date(dateCreated).toLocaleString('sv-SE',
            { year: 'numeric', month: 'numeric', day: 'numeric' }) : ''

        res.status(200).json(vDate)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(200).json(new Date().toLocaleString('sv-SE',
            { year: 'numeric', month: 'numeric', day: 'numeric' }))
    }
})

//Create new config
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const newconfig = await Config.create(req.body)
        if (!newconfig) return res.status(400).json('Error creating Config')

        res.status(201).json(newconfig)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update config data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        let configData = { ...req.body }

        const updated = await Config.findByIdAndUpdate(_id, configData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(400).send('Error updating Config')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove config
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body

        await Config.deleteOne({ _id })

        res.status(200).json(`Config ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})


module.exports = router