const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const { DB_PORT, DB_NAME } = process.env

const connect = async () => {
    await mongoose.connect(`mongodb://127.0.0.1:${DB_PORT}/${DB_NAME}`, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    
    const db = mongoose.connection;
    
    db.on('error', console.error.bind(console, 'MongoDB connection error:'));
    db.once('open', async () => {
        console.log('Connected to MongoDB');
    });
}

connect()

module.exports = mongoose