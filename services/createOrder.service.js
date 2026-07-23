const Order = require('../models/order.model')
const Cart = require('../models/cart.model')
const Product = require('../models/product.model')
const User = require('../models/user.model')
const stripe = require('../.config/stripe.config')
const mongoose = require('mongoose');
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants')
const sendEmail = require('../utils/sendEmail')




//@ POST Create order paymentMethod cash
//@ post/orders
//@ Auth User
const createCashOrder = async (userId, orderDetails) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const { shippingAddress, customerNote } = orderDetails

        const cart = await Cart.findOne({ user: userId }).session(session)
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

        const [order] = await Order.create([{
            user: userId,
            items: orderItems,
            shippingAddress,
            paymentMethod: 'cash',
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
        const user = await User.findById(userId);
        if (user) {
            try {
                const emailMessage = `
                            Thanks for order from us!
                            orderId: ${order._id}
                            Total Price: ${order.totalPrice.toFixed(2)}
                            ;
                        `
                await sendEmail({
                    to: user.email,
                    subject: "Order Confirmation!",
                    text: emailMessage
                })
            } catch (error) {
                console.error('order confirmation could not be sent', error)
            }
        }
        return order
    } catch (error) {
        await session.abortTransaction()
        throw (error)
    } finally {
        session.endSession()
    }
}

const createStripeOrder = async (userId, orderDetails) => {
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
        const { shippingAddress, customerNote } = orderDetails

        const cart = await Cart.findOne({ user: userId }).session(session)
        if (!cart || cart.items.length === 0) {
            throw new AppError(constantMessages.EMPTY_CART, 400)
        }
        const orderItems = []
        let subtotal = 0
        for (const item of cart.items) {
            const product = await Product.findOne(
                { _id: item.product, isActive: true, stock: { $gte: item.quantity } },

            ).session(session);
            if (!product) throw new AppError(constantMessages.PRODUCT_NOT_FOUND, 404)
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

        const shippingFee = subtotal >= 1000 ? 0 : 50
        const tax = subtotal * 0.14
        const totalPrice = subtotal + shippingFee + tax - discount

        const [order] = await Order.create([{
            user: userId,
            items: orderItems,
            shippingAddress,
            paymentMethod: 'stripe',
            paymentStatus: 'pending',
            subtotal,
            shippingFee,
            tax,
            discount,
            couponCode: cart.coupon?.code || null,
            totalPrice,
            customerNote
        }],
            { session }
        );

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(totalPrice * 100),

            currency: "egp",

            metadata: {
                orderId: order._id.toString(),
            },
        });

        order.transactionId = paymentIntent.id;
        await order.save({ session });
        await session.commitTransaction();
        // try {
        //     const emailMessage = `
        //                 Thanks for order from us!
        //                 orderId: ${order[0]._id}
        //                 Total Price: ${order[0].totalPrice.toFixed(2)}
        //                 ;
        //             `
        //     await sendEmail({
        //         to: req.user.email,
        //         subject: "Order Confirmation!",
        //         text: emailMessage
        //     })
        // } catch (error) {
        //     console.error('order confirmation could not be sent', error)
        // }
        return {
            orderId: order._id,

            clientSecret: paymentIntent.client_secret,
        };
    } catch (error) {
        await session.abortTransaction()
        throw (error)
    } finally {
        session.endSession()
    }
}
module.exports = {

    createOrder: async (userId, orderDetails) => {
        const { paymentMethod } = orderDetails;

        if (paymentMethod === "cash") {
            return await createCashOrder(userId, orderDetails);
        }

        if (paymentMethod === "stripe") {
            return await createStripeOrder(userId, orderDetails);
        }

        throw new AppError(constantMessages.INVALID_PAYMENT_METHOD, 400);
    },

    stripeWebhook: async (req) => {
        console.log("🔥 SERVICE HIT");
        const signature = req.headers["stripe-signature"];

        const event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET_KEY,
        );
        console.log("EVENT:", event.type);

        if (event.type === "payment_intent.payment_failed") {
            const paymentIntent = event.data.object;

            const session = await mongoose.startSession();

            try {
                session.startTransaction();

                const order = await Order.findById(
                    paymentIntent.metadata.orderId,
                ).session(session);

                if (!order) {
                    await session.commitTransaction();
                    return;
                }

                if (order.paymentStatus === "paid" || order.paymentStatus === "refunded") {
                    await session.commitTransaction();
                    return;
                }

                order.paymentStatus = "failed";

                order.status = "cancelled";

                order.cancelledAt = new Date();

                await order.save({ session });

                await session.commitTransaction();

                return order;
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                await session.endSession();
            }
        }

        if (event.type === "payment_intent.succeeded") {
            const paymentIntent = event.data.object;
            const session = await mongoose.startSession();

            try {
                session.startTransaction();

                const order = await Order.findById(
                    paymentIntent.metadata.orderId,
                ).session(session);

                if (!order) {
                    await session.commitTransaction();
                    return;
                }

                // prevent duplicate webhook
                if (
                    order.paymentStatus === "paid" ||
                    order.paymentStatus === "refunded"
                ) {
                    await session.commitTransaction();
                    return;
                }

                let outOfStock = false;

                // check stock first
                for (const item of order.items) {
                    const product = await Product.findById(item.product).session(session);

                    if (!product || !product.isActive || product.stock < item.quantity) {
                        outOfStock = true;
                        break;
                    }
                }

                // if stock unavailable
                if (outOfStock) {
                    await session.abortTransaction();

                    await stripe.refunds.create({
                        payment_intent: paymentIntent.id,
                    });

                    await Order.findByIdAndUpdate(order._id, {
                        status: "cancelled",
                        paymentStatus: "refunded",
                        cancelledAt: new Date(),
                        refundReason: "Out of stock",
                    });

                    return {
                        message: "Payment refunded because product is out of stock",
                    };
                }

                // decrease stock
                for (const item of order.items) {
                    const product = await Product.findOneAndUpdate(
                        { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
                        { $inc: { stock: -item.quantity } },
                        { session, new: true }
                    )
                    if (!product) {
                        throw new AppError("Product stock changed", 400);
                    }
                }

                // clear cart

                const cart = await Cart.findOne({
                    user: order.user,
                }).session(session);

                if (cart) {
                    cart.items = [];
                    cart.coupon = undefined;

                    await cart.save({
                        session,
                    });
                }

                order.paymentStatus = "paid";
                order.status = "confirmed";
                order.paidAt = new Date();
                order.transactionId = paymentIntent.id;

                await order.save({
                    session,
                });

                await session.commitTransaction();

                // send confirmation email

                const user = await User.findById(order.user);

                if (user) {
                    await sendEmail({
                        to: user.email,

                        subject: "Order Confirmation",

                        text: "order-confirmation",
                    });
                }

                return order;
            } catch (error) {
                await session.abortTransaction();

                throw error;
            } finally {
                await session.endSession();
            }
        }
    },
};



    