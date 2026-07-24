require('dotenv').config()
const express = require('express')
const app = express()
const routes = require('./routes')
const cors=require('cors')
const webHook = require('./routes/webhook.route')
const cookieParser = require('cookie-parser')
const errorHandler = require('./middleware/errorhandler.middleware')
// -----------------------------------
const port = process.env.PORT || 5000

require('./DB/dbConnection')

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use('/api/stripe', webHook)

app.use(express.json())
app.use(cookieParser())
app.use('/api', routes)
app.use(errorHandler)

app.listen(port, () => {
    console.log('Server is running on port', port);
})
// -------------------------

