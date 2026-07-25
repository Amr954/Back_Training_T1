require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const connectDB = require('./DB/dbConnection')
const errorHandler = require('./middleware/errorhandler.middleware')
const routes = require('./routes')
const webHook = require('./routes/webhook.route')
// -----------------------------------

const app = express()
connectDB();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
}));

app.use('/api/stripe', webHook)

app.use(express.json())
app.use(cookieParser())
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

app.use('/api', routes)

app.get('/', (req, res) => {
    res.send('Ecommerce API is running...');
});
app.use(errorHandler)

const port = process.env.PORT || 5000
app.listen(port, () => {
    console.log('Server is running on port', port);
})

module.exports = app;
// -------------------------

