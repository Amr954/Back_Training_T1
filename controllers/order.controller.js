const Order = require('../models/order.model')
const Cart = require('../models/cart.model')
const Product = require('../models/product.model')
const mongoose = require('mongoose');
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants')
const sendEmail = require('../utils/sendEmail')

/* Handle Order using mongoose Transactions */

const orderStatus = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
const validPaymentMethods = ['cash' , 'stripe']

const orderController = {

    //@ POST Create order
    //@ post/orders
    //@ Auth User
    placeOrder: async (req, res, next) => {
        const session = await mongoose.startSession()
        session.startTransaction()
        try {
            const { shippingAddress, paymentMethod, customerNote} = req.body

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
                // if (!product.isActive) throw new AppError(`${item.name} is unavailable now or out of stock`, 400)
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
                paymentMethod: paymentMethod || 'cash',
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
                    to: req.user.email,
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
    },

    //@ GET logged in user orders
    //@ get/orders
    //@ Auth User

    getMyOrders: async (req, res, next) => {
        try {
            const { status, paymentMethod, from, to } = req.query
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
            const skip = (page - 1) * limit

            if (status && !orderStatus.includes(status)) {
                return next(new AppError(`Invalid status. Must be one of ${orderStatus.join(',')}`, 400))
            }
            if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
                return next(new AppError(`Invalid paymentMethod. Must be one of ${validPaymentMethods.join(',')}`, 400))
            }
            let filter = { user: req.user.id }
            if (status) filter.status = status
            if (paymentMethod) filter.paymentMethod = paymentMethod
            if (from || to) {
                filter.createdAt = {}
                if (from) {
                    const fromDate = new Date(from)
                    fromDate.setHours(0, 0, 0, 0)
                    filter.createdAt.$gte = fromDate
                }
                if (to) {
                    const toDate = new Date(to)
                    toDate.setHours(23, 59, 59)
                    filter.createdAt.$lt = toDate
                }
                if(from && to && filter.createdAt.$gte > filter.createdAt.$lt){
                    return next(new AppError('"from" date must be before "to" date', 400))
                }
            }
            const [orders, total] = await Promise.all([
                Order.find(filter)
                    .skip(skip)
                    .limit(Number(limit))
                    .sort('-createdAt')
                    .lean(),
                Order.countDocuments(filter)
            ])
            res.status(200).json({
                success: true,
                message: `count of orders ${orders.length}`,
                total,
                data: orders,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            next(error)
        }
    },

    //@ GET logged in user specific order
    //@ get/my/:id
    //@ Auth User

    getOrder: async (req, res, next) => {
        try {
            const order = await Order.findOne({ _id: req.params.id, user: req.user.id })
            if (!order) { return next(new AppError(constantMessages.ORDER_NOT_FOUND, 404)) }
            res.status(200).json({ success: true, data: order })
        } catch (error) {
            next(error)
        }
    },

    //@ PATCH cancel order only it's status is pending or confirmed
    //@ patch/my/:id/cancel
    //@ Auth User

    cancelAnOrder: async (req, res, next) => {
        const session = await mongoose.startSession()
        session.startTransaction()
        try {
            const order = await Order.findOne({ _id: req.params.id, user: req.user.id }).session(session)
            if (!order) { return next(new AppError(constantMessages.ORDER_NOT_FOUND, 404)) }
            if (order.status !== 'pending' && order.status !== 'confirmed') {
                return next(new AppError(constantMessages.ORDER_CANNOT_CANCELLED, 400))
            }
            order.status = 'cancelled'
            order.cancelledAt = Date.now()
            await order.save({ session })

            // if the order is cancelled restore the stock 
            for (const item of order.items) {
                const product = await Product.findOneAndUpdate(
                    { _id: item.product },
                    { $inc: { stock: item.quantity } },
                    { session }
                )
            }
            await session.commitTransaction();
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            await session.abortTransaction();
            next(error)
        } finally {
            session.endSession()
        }
    },

    
}



module.exports = orderController