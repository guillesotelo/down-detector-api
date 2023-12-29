const mongoose = require('mongoose')

const systemSchema = new mongoose.Schema({
    name: {
        type: String
    },
    url: {
        type: String,
        required: true
    },
    type: {
        type: String
    },
    description: {
        type: String
    },
    timeout: {
        type: Number
    },
    interval: {
        type: Number
    },
    alertThreshold: {
        type: Number,
        default: 3
    },
    alertsExpiration: {
        type: Number,
        default: 2
    },
    owner: {
        type: String
    },
    ownerId: {
        type: String
    },
    createdBy: {
        type: String
    },
    updatedBy: {
        type: String
    },
    lastCheck: {
        type: Date,
        default: new Date()
    },
    lastCheckStatus: {
        type: Boolean
    },
    active: {
        type: Boolean,
        default: true
    },
    reportedlyDown: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

const System = mongoose.model('System', systemSchema)

module.exports = System