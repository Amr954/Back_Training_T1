const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cart.controller')
const validate = require('../middleware/validate.middleware')
const { authentication } = require('../middleware/auth.middleware')
const { addItemToCartSchema, updateItemQuantitySchema } = require('../validation/cart.validation')

router.use(authentication)
// @ GET
router.get('/',cartController.getCarts)

//@ POST
router.post('/items',validate(addItemToCartSchema),cartController.addToCart)
router.post('/coupon',cartController.applyCoupon)

//@ PATCH
router.patch('/items',validate(updateItemQuantitySchema),cartController.updateItemQuantity)

//@ DELETE
router.delete('/items/:productId',cartController.deleteFromCart)
router.delete('/coupon',cartController.removeCoupon)
router.delete('/clear',cartController.clearCart)

module.exports = router