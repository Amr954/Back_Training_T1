const Order = require('../models/order.model')
const Cart = require('../models/cart.model')
const Product = require('../models/product.model')
const orderService = require('../services/createOrder.service')
const stripe = require('../.config/stripe.config')
const mongoose = require('mongoose');
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants')
const sendEmail = require('../utils/sendEmail')

/* Handle Order using mongoose Transactions */

const orderStatus = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']
const validPaymentMethods = ['cash', 'stripe']

const orderController = {

    placeOrder: async (req, res, next) => {
        try {

            const order = await orderService.createOrder(req.user._id, req.body);

            res.status(201).json({
                success: true,
                message: "Order created successfully",
                data: order
            });

        } catch (error) {
            next(error);
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
                if (from && to && filter.createdAt.$gte > filter.createdAt.$lt) {
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
            if (order.status === 'cancelled') {
                throw new AppError('Order already cancelled', 400)
            }

            const restoreStock =
                order.paymentMethod === "cash" || order.paymentStatus === "paid";

            if (order.paymentMethod === 'stripe' && order.paymentStatus === 'paid') {
                await stripe.refunds.create({
                    payment_intent: order.transactionId
                })
                order.paymentStatus = "refunded";
            }

            // if the order is cancelled restore the stock 
            if (restoreStock) {
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.product,
                        {
                            $inc: {
                                stock: item.quantity,
                            },
                        },
                        { session }
                    );
                }
            }

            order.status = 'cancelled'
            order.cancelledAt = Date.now()
            await order.save({ session })
            await session.commitTransaction();

            res.status(200).json({ success: true, data: order });
        } catch (error) {
            await session.abortTransaction();
            next(error)
        } finally {
            session.endSession()
        }
    },

    //@Stripe Webhook

    stripeWebHook: async (req, res, next) => {
        console.log("🔥 CONTROLLER HIT");
        try {

            await orderService.stripeWebhook(req);

            console.log("🔥 WEBHOOK FINISHED");

            res.status(200).json({ received: true });

        } catch (error) {
            console.log("WEBHOOK ERROR:", error);
            next(error);
        }
    }

}



module.exports = orderController