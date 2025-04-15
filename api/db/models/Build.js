const mongoose = require('mongoose')

const BuildSchema = new mongoose.Schema({
    data: {
        type: String
    },
}, { timestamps: true })

const Build = mongoose.model('Build', BuildSchema)

module.exports = Build