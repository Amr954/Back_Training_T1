const express = require('express')
const router = express.Router()
const orderController = require('../controllers/order.controller')
const validate = require('../middleware/validate.middleware')
const { authentication } = require('../middleware/auth.middleware')
const { placeOrderSchema } = require('../validation/order.validation')

//@ POST
router.post('/',authentication,validate(placeOrderSchema),orderController.placeOrder)

//@ GET
router.get('/my',authentication,orderController.getMyOrders)
router.get('/my/:id',authentication,orderController.getOrder)

//@ PATCH
router.patch('/my/:id/cancel',authentication,orderController.cancelAnOrder)

module.exports = router


