const dotenv = require('dotenv')
const express = require('express')
const router = express.Router()
const { User, AppLog, System, Config } = require('../db/models')
const jwt = require('jsonwebtoken')
dotenv.config()
const { JWT_SECRET } = process.env
const { verifyToken } = require('../helpers')

//User Login
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body

        // This three lines creates a new user at login.
        // const newUser = await User.create({ ...req.body, username: 'Guillermo Sotelo', isSuper: true })
        // const jwtToken = jwt.sign({ sub: newUser._id }, JWT_SECRET, { expiresIn: '30d' })
        // return res.status(200).json({ ...newUser._doc, password: null, token: jwtToken })

        const user = await User.findOne({ email }).populate('systems').exec()

        if (!user) return res.status(401).send('Unauthorized')

        const compareRes = await user.comparePassword(password)
        if (!compareRes) {
            await AppLog.create({
                username: email ? email.split('@')[0] : 'unknown',
                email: email,
                details: `Login attempt failed`,
                module: 'User'
            })
            return res.status(401).send('Unauthorized')
        }

        const token = jwt.sign({ sub: user._id }, JWT_SECRET, { expiresIn: '30d' })
        const config = await Config.findOne({ name: 'app' }).exec()

        await AppLog.create({
            username: user.username,
            email: user.email,
            details: `New Login`,
            module: 'User'
        })

        res.status(200).json({ ...user._doc, password: null, token, config })
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

// Verify user token
router.post('/verify', async (req, res, next) => {
    try {
        const { email } = req.body
        const bearerHeader = req.headers['authorization']
        if (bearerHeader) {
            const token = bearerHeader.split(' ')[1]
            jwt.verify(token, JWT_SECRET, async (error, _) => {
                if (error) return res.status(403)

                const userData = await User.findOne({ email }).select('-password').exec()
                const config = await Config.findOne({ name: 'app' }).exec()

                res.status(200).json({
                    ...userData._doc,
                    token,
                    config
                })
            })
        } else res.status(403)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Create new user / register
router.post('/create', verifyToken, async (req, res, next) => {
    try {
        const { email, user, ownedSystems } = req.body
        const systemIds = ownedSystems.map(system => system._id)

        const emailRegistered = await User.findOne({ email }).exec()
        if (emailRegistered) return res.status(409).send('Email already in use')

        const newUser = await User.create({
            ...req.body,
            systems: systemIds
        })
        if (!newUser) return res.status(400).send('Error creating User')

        await System.updateMany(
            { _id: { $in: systemIds } },
            { $addToSet: { owners: newUser._id } }
        )

        await AppLog.create({
            username: user.username || '',
            email: user.email || '',
            details: `User created: ${newUser.username || ''}`,
            module: 'User'
        })

        res.status(201).json(newUser)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Get all users
router.get('/getAll', verifyToken, async (req, res, next) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 }).populate('systems')
        if (!users || !users.length) return res.status(200).send('No users found')

        res.status(200).json(users)
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

//Update User Data
router.post('/update', verifyToken, async (req, res, next) => {
    try {
        const { _id, newData, user } = req.body
        const { ownedSystems } = newData

        if (ownedSystems && Array.isArray(ownedSystems)) {
            newData.systems = ownedSystems.map(system => system._id)
        }

        const newUser = await User.findByIdAndUpdate(
            _id,
            newData,
            { returnDocument: "after", useFindAndModify: false }
        ).select('-password').populate('systems')

        if (!newUser) return res.status(400).send('Error updating User')

        await System.updateMany(
            { _id: { $in: newData.systems } },
            { $addToSet: { owners: _id } }
        )
        await System.updateMany(
            { owners: _id, _id: { $nin: newData.systems } },
            { $pull: { owners: _id } }
        )

        const token = jwt.sign({ sub: newUser._id }, JWT_SECRET, { expiresIn: '30d' })
        const config = await Config.findOne({ name: 'app' }).exec()

        await AppLog.create({
            username: user.username || '',
            email: user.email || '',
            details: `User updated: ${newUser.username || ''}`,
            module: 'User'
        })

        res.status(200).json({ ...newUser._doc, token, config })
    } catch (err) {
        console.error('Something went wrong!', err)
        return res.status(500).send('Server Error')
    }
})

//Remove User
router.post('/remove', verifyToken, async (req, res, next) => {
    try {
        const { email, user } = req.body

        const exists = await User.findOne({ email }).exec()
        if (!exists) return res.status(404).send('User not found')

        const removed = await User.deleteOne({ email })

        await System.updateMany(
            { owners: exists._id },
            { $pull: { owners: exists._id } }
        )

        await AppLog.create({
            username: user.username || '',
            email: user.email || '',
            details: `User removed: ${exists.username || ''}`,
            module: 'User'
        })
        if (!removed) return res.status(400).send('Error deleting user')

        res.status(200).send('User removed successfully')
    } catch (err) {
        console.error('Something went wrong!', err)
        res.status(500).send('Server Error')
    }
})

module.exports = router