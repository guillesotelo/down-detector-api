const mongoose = require('mongoose')

const userAlertSchema = new mongoose.Schema({
    systemId: {
        type: String
    },
    type: {
        type: String
    },
    description: {
        type: String
    },
}, { timestamps: true })

const UserAlert = mongoose.model('UserAlert', userAlertSchema)

module.exports = UserAlert