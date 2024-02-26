const mongoose = require('mongoose')

const historySchema = new mongoose.Schema({
    systemId: {
        type: String
    },
    url: {
        type: String
    },
    status: {
        type: Boolean
    },
    message: {
        type: String
    },
    description: {
        type: String
    },
    raw: {
        type: String
    },
}, { timestamps: true })

// Index definitions (query performance)
historySchema.index({ systemId: 1, createdAt: -1 })
historySchema.index({ createdAt: -1 })

const History = mongoose.model('History', historySchema)

module.exports = History