const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin.controller')
const { adminAuthorization } = require('../middleware/auth.middleware')

router.use(adminAuthorization)

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
router.patch('/:id/status',adminController.updateOrderStatus)


module.exports = router