const express = require('express')
const router = express.Router()
const { verifyToken } = require('../helpers')

const userRoutes = require('./user')
const systemRoutes = require('./system')
const appRoutes = require('./app')
const appLogRoutes = require('./appLog')
const eventRoutes = require('./event')
const historyRoutes = require('./history')
const userAlertRoutes = require('./userAlert')

router.use('/user', userRoutes)
router.use('/system', systemRoutes)
router.use('/app', appRoutes)
router.use('/appLog', appLogRoutes)
router.use('/event', eventRoutes)
router.use('/history', historyRoutes)
router.use('/userAlert', userAlertRoutes)

module.exports = router, verifyToken