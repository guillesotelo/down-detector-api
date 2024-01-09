const mongoose = require('mongoose')

const appSchema = new mongoose.Schema({
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

const App = mongoose.model('App', appSchema)

module.exports = App