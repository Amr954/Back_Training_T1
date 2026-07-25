const dns = require('dns')

dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
])
const mongoose = require('mongoose')
const url = process.env.DB_CONNECTION_URL
const connectDB = async () => {
    try {
        await mongoose.connect(url)
        console.log("Database connected successfully!");
        console.log(mongoose.connection.host);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

module.exports = connectDB
