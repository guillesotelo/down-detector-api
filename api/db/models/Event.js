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
    updatedBy: {
        type: String
    },
    systemId: {
        type: String
    },
    note: {
        type: String
    },
}, { timestamps: true })

const Event = mongoose.model('Event', eventSchema)

module.exports = Event