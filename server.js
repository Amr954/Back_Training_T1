require('dotenv').config()
const express = require('express')
const app = express() 
const routes = require('./routes')
const cookieParser = require('cookie-parser')
const errorHandler = require('./middleware/errorhandler.middleware')
// -----------------------------------
require('./DB/dbConnection')

app.use(express.json())
app.use(cookieParser())
app.use('/api', routes)
app.use(errorHandler)

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log('Server is running on port', port);
})
// -------------------------

// const crypto = require('crypto')
// console.log(crypto.randomBytes(32).toString("hex"));