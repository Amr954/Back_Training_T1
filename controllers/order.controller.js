const Order = require('../models/order.model')
const Cart = require('../models/cart.model')
const Product = require('../models/product.model')
const mongoose = require('mongoose');
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants')
const sendEmail = require('../utils/sendEmail')

/* Handle Order using mongoose Transactions */

const orderController = {

    //@ POST Create order
    //@ post/orders
    //@ Auth User
    placeOrder: async (req, res, next) => {
        const session = await mongoose.startSession()
        session.startTransaction()
        try {
            const { shippingAddress, paymentMethod, customerNote } = req.body

            const cart = await Cart.findOne({ user: req.user.id }).session(session)
            if (!cart || cart.items.length === 0) {
                throw new AppError(constantMessages.EMPTY_CART, 400)
            }
            const orderItems = []
            let subtotal = 0
            for (const item of cart.items) {
                const product = await Product.findOneAndUpdate(
                    { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { session, new: true }
                )
                if (!product) throw new AppError(constantMessages.PRODUCT_NOT_FOUND, 404)
                if (!product.isActive) throw new AppError(`${item.name} is unavailable now or out of stock`, 400)
                const price = product.discountPrice > 0 ? product.discountPrice : product.price

                orderItems.push({
                    product: product._id,
                    name: product.name,
                    image: product.images[0]?.url,
                    price,
                    quantity: item.quantity
                })
                subtotal += price * item.quantity
            }
            let discount = cart.discountAmount || 0
            // let discount = 0
            // if(cart.coupon && cart.coupon.code){
            //     if(cart.coupon.discountType === 'percentage'){
            //         discount = Math.min((subtotal * cart.coupon.discountValue) / 100,subtotal)
            //     }else{
            //         discount = Math.min(cart.coupon.discountValue,subtotal)
            //     }
            // }

            const shippingFee = subtotal >= 1000 ? 0 : 50
            const tax = subtotal * 0.14
            const totalPrice = subtotal + shippingFee + tax - discount

            const order = await Order.create([{
                user: req.user.id,
                items: orderItems,
                shippingAddress,
                paymentMethod: 'cash',
                paymentStatus: 'pending',
                subtotal,
                shippingFee,
                tax,
                discount,
                couponCode: cart.coupon?.code || null,
                totalPrice,
                customerNote
            }], { session })
            cart.items = []
            cart.coupon = undefined

            await cart.save({ session });
            await session.commitTransaction();
            try {
                const emailMessage = `
                    Thanks for order from us!
                    orderId: ${order[0]._id}
                    Total Price: ${order[0].totalPrice.toFixed(2)}
                    ;
                `
                await sendEmail({
                    to:req.user.email,
                    subject: "Order Confirmation!",
                    text: emailMessage
                })
            } catch (error) {
                console.error('order confirmation could not be sent', error)
            }
            res.status(201).json({ success: true, data: order[0] });
        } catch (error) {
            await session.abortTransaction()
            next(error)
        } finally {
            session.endSession()
        }
    }
}

module.exports = orderController