const mongoose = require('mongoose')

const BuildSchema = new mongoose.Schema({
    classifier: {
        type: String
    },
    date: {
        type: Date | String
    },
    target_branch: {
        type: String
    },
    modules: {
        type: String
    },
    active: {
        type: Boolean,
        default: true
    },
    name: {
        type: String
    },
    rawData: {
        type: String
    },
}, { timestamps: true })

const Build = mongoose.model('Build', BuildSchema)

module.exports = Build