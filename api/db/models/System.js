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
    createdBy: {
        type: String
    },
    modifiedBy: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

const System = mongoose.model('System', systemSchema)

module.exports = System