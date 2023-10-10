const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Endpoint } = require('./models');

dotenv.config();

const { DB_PORT, DB_NAME } = process.env

mongoose.connect(`mongodb://localhost:${DB_PORT}/${DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
    console.log('Connected to MongoDB');

    // Testing DB: create a new row in document Endpoint
    // await Endpoint.create({ url: 'test'})
});


module.exports = mongoose