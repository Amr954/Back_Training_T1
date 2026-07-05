const mongoose = require('mongoose')
const dns = require('dns')
dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
])

const url = process.env.DB_CONNECTION_URL
mongoose.connect(url)
.then(() => {
    console.log("Database connected successfully!");
    console.log(mongoose.connection.host);
    })
    .catch((err) => {
        console.error(err);
    })
  