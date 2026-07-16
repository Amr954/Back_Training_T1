const Cart = require('../models/cart.model')
const Product = require('../models/product.model')
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

const cartController = {

    //@ GET CARTS
    //@ route Get/carts
    //@ Auth User
    getCarts: async (req, res, next) => {
        try {
            const carts = await getCartOrCreateIt(req)
            res.status(200).json({
                success: true,
                message: constantMessages.CART_CREATED,
                data: carts
            });
        } catch (error) {
            next(error)
        }
    },

    //@ POST add to CARTS
    //@ route post/carts
    //@ Auth User

    addToCart: async (req, res, next) => {
        try {
            const { productId, quantity } = req.body
            if (!productId) { return next(new AppError('productId is required', 404)) }
            const product = await Product.findById(productId)
            const q = Number(quantity)
            if (!product) { return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404)) }
            if (!product.isActive) { return next(new AppError(constantMessages.PRODUCT_INACTIVE, 400)) }

            if (isNaN(q)) { return res.status(400).json({ message: 'quantity must be a number' }); }

            if (q <= 0) { return res.status(400).json({ message: 'quantity must be equal 1 or more' }) }
            if (product.stock < q) { return next(new AppError(constantMessages.NOT_ENOUGH_STOCK, 400)) };

            const cart = await getCartOrCreateIt(req)

            const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId)
            if (existingItemIndex > -1) {
                cart.items[existingItemIndex].quantity += q
            } else {
                cart.items.push({
                    product: product._id,
                    name: product.name,
                    image: product.images[0]?.url,
                    price: product.discountPrice > 0 ? product.discountPrice : product.price,
                    quantity: q
                })
            }

            await cart.save()
            res.status(200).json({ success: true, messaage: "Item added to cart!", data: cart });
        } catch (error) {
            next(error)
        }
    },

    //@ PATCH Item Quantity
    //@ route patch/carts
    //@ Auth User

    updateItemQuantity: async (req, res, next) => {
        try {
            const { productId, quantity } = req.body

            const cart = await getCartOrCreateIt(req)
            if (!cart) throw new AppError(constantMessages.CART_NOT_FOUND, 404);

            const itemIndex = cart.items.findIndex(item => item.product.toString() === productId)
            if (itemIndex === -1) throw new AppError('Item not in cart', 404)
            const q = Number(quantity)
            const product = await Product.findById(productId)
            if (!product) {
                return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404))
            }
            if (product.stock < q) { return next(new AppError(constantMessages.NOT_ENOUGH_STOCK, 400)) }

            cart.items[itemIndex].quantity = Number(quantity)
            await cart.save()
            res.status(200).json({ success: true, messaage: "Quantity changed!", data: cart });
        } catch (error) {
            next(error)
        }
    },

    //@ DELETE from cart
    //@ route delete/carts/:id
    //@ Auth User

    deleteFromCart: async (req, res, next) => {
        try {
            const cart = await getCartOrCreateIt(req)

            if (!cart) throw new AppError(constantMessages.CART_NOT_FOUND, 404);
            const itemIndex = cart.items.findIndex(item => item.product.toString() === req.params.productId)
            if (itemIndex === -1) throw new AppError('Item not in cart', 404)

            const q = cart.items[itemIndex].quantity;
            cart.items.splice(itemIndex, 1)
            await cart.save()
            res.status(200).json({ success: true, data: cart });

        } catch (error) {
            next(error)
        }

    },

    //@ POST apply coupon
    //@ route post/carts/coupon
    //@ Auth User

    applyCoupon: async (req, res, next) => {
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
    },

    //@ DELETE applied coupon
    //@ route delete/carts/coupon
    //@ Auth User

    removeCoupon: async (req, res, next) => {
        try {
            const cart = await getCartOrCreateIt(req)
            if (!cart) {
                return next(new AppError(constantMessages.CART_NOT_FOUND, 404));
            }
            cart.coupon = undefined;
            await cart.save()
            res.status(200).json({ success: true, data: cart });
        } catch (error) {
            next(error)
        }
    },

    //@ DELETE all items in carts
    //@ route delete/carts/clear
    //@ Auth User

    clearCart: async (req, res, next) => {
        try {
            const cart = await getCartOrCreateIt(req)
            if (!cart) {
                return next(new AppError(constantMessages.CART_NOT_FOUND, 404));
            }
            cart.items = []
            cart.coupon = undefined;
            await cart.save()
            res.status(200).json({ success: true, data: cart });
        } catch (error) {
            next(error)
        }
    }
}


module.exports = cartController