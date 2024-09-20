const express = require('express')
const router = express.Router()
const { verifyToken } = require('../helpers')

const userRoutes = require('./user')
const systemRoutes = require('./system')
const configRoutes = require('./config')
const appLogRoutes = require('./appLog')
const eventRoutes = require('./event')
const historyRoutes = require('./history')
const userAlertRoutes = require('./userAlert')
const subscriptionRoutes = require('./subscription')

router.use('/user', userRoutes)
router.use('/system', systemRoutes)
router.use('/config', configRoutes)
router.use('/appLog', appLogRoutes)
router.use('/event', eventRoutes)
router.use('/history', historyRoutes)
router.use('/userAlert', userAlertRoutes)
router.use('/subscription', subscriptionRoutes)

module.exports = router, verifyToken