const express = require('express')
const router = express.Router()
const { verifyToken } = require('../helpers')

const userRoutes = require('./user')
const endPointRoutes = require('./endpoint')
const appRoutes = require('./app')

router.use('/user', userRoutes)
router.use('/endpoint', endPointRoutes)
router.use('/app', appRoutes)

module.exports = router, verifyToken