const express = require('express')
const { Build } = require('../db/models')
const { verifyToken } = require('../helpers')
const router = express.Router()

//Get all builds
router.get('/getAll', async (req, res, next) => {
    try {
        const builds = await Build.find().sort({ createdAt: -1 })
        if (!builds || !builds.length) return res.status(200).send('No Builds found')

        res.status(200).json(builds)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

// Get unique builds
router.get('/getUnique', async (req, res, next) => {
    try {
        const builds = await Build.find({ active: true }).sort({ createdAt: -1 })
        let exists = {}
        let filtered = []

        if (!builds || !builds.length) return res.status(200).send('No Builds found')

        filtered = builds.filter(b => {
            if (exists[b.classifier + b.target_branch]) return false
            exists[b.classifier + b.target_branch] = true
            return true
        })

        res.status(200).json(filtered)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get build by ID
router.get('/getById', async (req, res, next) => {
    try {
        const { _id } = req.query
        const build = await Build.findById(_id)
        if (!build) return res.status(404).send('Build not found')

        res.status(200).json(build)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get builds by classifier and branch
router.get('/getByClassAndBranch', async (req, res, next) => {
    try {
        const { classifier, target_branch } = req.query
        
        const builds = await Build.find({ classifier, target_branch })
        if (!builds) return res.status(400).send('Bad request')

        res.status(200).json(builds)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Create new build
router.post('/create', async (req, res, next) => {
    try {
        const { classifier, date, target_branch, modules, active, name } = req.body

        const buildData = {
            classifier,
            date,
            target_branch,
            active,
            name,
            modules: typeof modules === 'string' ? modules : JSON.stringify(modules || '{}'),
            rawData: classifier ? '' : JSON.stringify(req.body)
        }

        const newBuild = await Build.create(buildData)
        if (!newBuild) return res.status(400).json('Error creating Build')

        res.status(201).json("Build tracking data created successfully.")
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update build data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body
        const { classifier, date, target_branch, modules, active, name } = req.body

        const buildData = {
            classifier,
            date,
            target_branch,
            active,
            name,
            modules: typeof modules === 'string' ? modules : JSON.stringify(modules || '{}'),
            rawData: classifier ? '' : JSON.stringify(req.body)
        }

        const updated = await Build.findByIdAndUpdate(_id, buildData, { returnDocument: "after", useFindAndModify: false })
        if (!updated) return res.status(400).send('Error updating Build')

        res.status(200).json(updated)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Remove build
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { _id } = req.body

        await Build.deleteOne({ _id })

        res.status(200).json(`Build ${_id} deleted`)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router