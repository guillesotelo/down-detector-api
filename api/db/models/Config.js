const mongoose = require('mongoose')

const configSchema = new mongoose.Schema({
    name: {
        type: String
    },
    creator: {
        type: String
    },
    maintainer: {
        type: String
    },
    license: {
        type: String
    },
    server: {
        type: String
    },
    repo: {
        type: String
    },
    version: {
        type: String
    },
}, { timestamps: true })

const Config = mongoose.model('Config', configSchema)

module.exports = Config