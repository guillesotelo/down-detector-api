const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    title: {
        type: String
    },
    start: {
        type: Date
    },
    end: {
        type: Date
    },
    createdBy: {
        type: String
    },
    systemId: {
        type: String
    },
    message: {
        type: String
    },
}, { timestamps: true })

const Event = mongoose.model('Event', eventSchema)

module.exports = Event