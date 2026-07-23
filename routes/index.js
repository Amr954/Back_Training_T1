const express = require('express')
const router = express.Router()
const authRouter = require('./auth.route')
const userRouter = require('./user.route')
const productRouter = require('./product.route')
const cartRouter = require('./cart.route')
const wishListRouter = require('./wishList.route')
const orderRouter = require('./order.route')
const adminRouter = require('./admin.route')



router.use('/auth',authRouter)
router.use('/users',userRouter)
router.use('/products',productRouter)
router.use('/carts',cartRouter)
router.use('/wishlist',wishListRouter)
router.use('/orders',orderRouter)
router.use('/admin',adminRouter)


module.exports = router