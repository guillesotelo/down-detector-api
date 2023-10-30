const mongoose = require('mongoose')

const appLogSchema = new mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    details: {
        type: String
    },
    module: {
        type: String
    },
}, { timestamps: true })

const AppLog = mongoose.model('AppLog', appLogSchema)

module.exports = AppLog