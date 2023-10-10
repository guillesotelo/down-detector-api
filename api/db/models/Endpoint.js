const mongoose = require('mongoose')

const endpointSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
}, { timestamps: true })

const Endpoint = mongoose.model('Endpoint', endpointSchema)

module.exports = Endpoint