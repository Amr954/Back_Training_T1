const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')

router.post("/webhook",express.raw({ type: "application/json" }),orderController.stripeWebHook);

module.exports = router