const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin.controller')
const { adminAuthorization, authentication } = require('../middleware/auth.middleware')
const validate = require('../middleware/validate.middleware')
const { updateOrderStatusSchema } = require('../validation/order.validation')

router.use(authentication,adminAuthorization('admin'))

//@GET
// Static routes comes before dynamic routes
router.get('/dashboard',adminController.adminDashboardStats)
router.get('/carts',adminController.getCarts)
router.get('/',adminController.getAllOrders)
router.get('/wishlists/stats',adminController.wishListsStats)
router.get('/wishlists',adminController.getAllWishLists)

// dynamic routes
router.get('/:id',adminController.getSingleOrder)

//@PATCH
router.patch('/:id/status',validate(updateOrderStatusSchema),adminController.updateOrderStatus)


module.exports = router