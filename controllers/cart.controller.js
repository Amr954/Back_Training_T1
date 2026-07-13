const Cart = require('../models/cart.model')
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants')

/*************** 
  @ Handle Cart Controller
 ***************/


const Coupons = {
    SAVE10: { discountType: 'percentage', discountValue: 10 },
    SAVE20: { discountType: 'percentage', discountValue: 20 },
    SAVE50: { discountType: 'percentage', discountValue: 50 },
    SAVE80: { discountType: 'percentage', discountValue: 80 },
    OFF50: { discountType: 'fixed', discountValue: 50 }
}

const getCartOrCreateIt = async (req) => {
    let userCart = await Cart.findOne({ user: req.user.id })
    if (!userCart) {
        userCart = await Cart.create({ user: req.user.id, items: [] })
    }
    return userCart
}

const applyCoupon = async (req, res, next) => {
    try {
        const { code } = req.body
        const couponCode = code?.toUpperCase()
        const coupon = Coupons[couponCode]

        if (!coupon) {
            return next(new AppError('Invalid coupon code', 400))
        }
        const cart = await getCartOrCreateIt(req)
        if (!cart.items?.length) {
            return next(new AppError('Cannot apply a coupon to an empty cart', 400))
        }
        cart.coupon = {
            code: couponCode,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue
        }

        await cart.save()

        res.status(200).json({ success: true, data: cart })
    } catch (error) {
        next(error)
    }
}

const cartController = {

    //@ GET CARTS
    //@ route Get/carts
    //@ Auth User
    getCarts: async(req,res,next)=>{
        try {
            const carts = await getCartOrCreateIt(req)
            res.status(200).json({ 
                success: true,
                message:constantMessages.CART_CREATED, 
                data: carts 
            });
        } catch (error) {
            next(error)
        }
    }

}

module.exports = cartController