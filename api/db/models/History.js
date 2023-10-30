const mongoose = require('mongoose')

const historySchema = new mongoose.Schema({
    systemId: {
        type: String
    },
    url: {
        type: String,
        required: true
    },
    status: {
        type: Boolean
    },
    description: {
        type: String
    },
}, { timestamps: true })

const History = mongoose.model('History', historySchema)

module.exports = History