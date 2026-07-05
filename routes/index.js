const express = require('express')
const router = express.Router()
const authRouter = require('./auth.route')
const userRouter = require('./user.route')

router.use('/auth',authRouter)

module.exports = router