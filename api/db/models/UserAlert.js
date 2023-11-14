const mongoose = require('mongoose')

const userAlertSchema = new mongoose.Schema({
    systemId: {
        type: String
    },
    url: {
        type: String
    },
    type: {
        type: String
    },
    description: {
        type: String
    },
    userAlert: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

const UserAlert = mongoose.model('UserAlert', userAlertSchema)

module.exports = UserAlert