const dotenv = require('dotenv')
dotenv.config()
const crypto = require('crypto');
const ALG = "aes-256-cbc"
const jwt = require('jsonwebtoken')
const { JWT_SECRET, KEY, IV } = process.env

const encrypt = text => {
    let cipher = crypto.createCipheriv(ALG, KEY, IV);
    let encrypted = cipher.update(text.toString(), 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

const decrypt = text => {
    let decipher = crypto.createDecipheriv(ALG, KEY, IV);
    let decrypted = decipher.update(text, 'base64', 'utf8');
    return (decrypted + decipher.final('utf8'));
}

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization']
    if (bearerHeader) {
        const bearerToken = bearerHeader.split(' ')[1]
        jwt.verify(bearerToken, JWT_SECRET, (error, _) => {
            if (error) return res.status(403)
            next()
        })
    } else res.status(403)
}

const isJson = str => {
    try {
        JSON.stringify(str)
    } catch (e) {
        return false
    }
    return true
}

const isValidUrl = (url) => {
    if (!url.trim()) return false
    const regex = /[^\w\s\-._~:/?#[\]@!$&'()*+,;=%]/
    return !regex.test(url)
}

module.exports = {
    encrypt,
    decrypt,
    verifyToken,
    isJson,
    isValidUrl,
}