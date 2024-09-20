const mongoose = require('mongoose')

const subscriptionSchema = new mongoose.Schema({
    systemId: {
        type: String
    },
    name: {
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
    geoLocation: {
        type: String
    },
    navigator: {
        type: String
    },
    username: {
        type: String
    },
    email: {
        type: String
    },
    isSubscription: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

const Subscription = mongoose.model('Subscription', subscriptionSchema)

module.exports = Subscription