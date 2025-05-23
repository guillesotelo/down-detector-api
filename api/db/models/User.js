const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isSuper: {
        type: Boolean,
        default: false
    },
    buildTrackerAccess: {
        type: Boolean,
        default: false
    },
    systems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'System'
    }]
}, { timestamps: true })

userSchema.pre('save', function (next) {
    const user = this
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (saltError, salt) {
            if (saltError) return next(saltError)
            else {
                bcrypt.hash(user.password, salt, function (hashError, hash) {
                    if (hashError) return next(hashError)
                    user.password = hash
                    next()
                })
            }
        })
    } else return next()
})

userSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate()
    if (update.password) {
        bcrypt.genSalt(10, function (saltError, salt) {
            if (saltError) return next(saltError)
            else {
                bcrypt.hash(update.password, salt, function (hashError, hash) {
                    if (hashError) return next(hashError)
                    update.password = hash;
                    next()
                })
            }
        })
    } else return next()
})

userSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password).then(res => res)
}

const User = mongoose.model('User', userSchema)

module.exports = User