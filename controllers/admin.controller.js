const Order = require('../models/order.model')
const Cart = require('../models/cart.model')
const Product = require('../models/product.model')
const WishList = require('../models/wishlist.model')
const User = require('../models/user.model')
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants')
const sendEmail = require('../utils/sendEmail')
const { warn } = require('winston')

/*
------------------ Admin Controller -----------------

1- GET Dashboard: Full stats
2- GET Carts
3- GET Orders
4- GET single order:
5: GET Wishlists
6- PATCH update order status
*/

const adminController = {
    //@ GET admin dashboard
    //@ get/admin/dashboard
    //@ Auth Admin

    adminDashboardStats: async (req, res, next) => {
        try {
            const now = new Date()
            const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate - 6)

            const [
                totalRevenue,
                thisMonthRevenueResult,
                lastMonthRevenueResult,
                ordersByStatus,
                totalCustomers,
                totalAdmins,
                totalProducts,
                topProducts,
                recentOrders,
                dailyRevenue,
            ] = await Promise.all([
                //1- Total revenues // هنشيل الطلبات الملغية مش هنحسبها 
                Order.aggregate([
                    { $match: { status: { $ne: 'cancelled' } } },
                    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
                ]),

                //2- current month revenue
                Order.aggregate([
                    { $match: { createdAt: { $gte: currentMonthStart }, status: { $ne: 'cancelled' } } },
                    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
                ]),

                //3- last month revenue

                Order.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
                            status: { $ne: 'cancelled' }
                        }
                    },
                    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
                ]),

                //4-ordersByStatus
                Order.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),

                //4-TotalCustomers
                User.countDocuments({ role: 'customer' }),

                //5-TotalAdmins
                User.countDocuments({ role: 'admin' }),

                //6-TotalAdmins
                Product.countDocuments(),

                //7-Recent orders
                Order.find().sort('-createdAt').limit(5).populate('user', 'userName').lean(),

                //8-Top products by sale
                Order.aggregate([
                    { $match: { status: { $ne: 'cancelled' } } },
                    { $unwind: '$items' },
                    {
                        $group: {
                            _id: '$items.product',
                            name: { $first: '$items.name' },
                            image: { $first: '$items.image' },
                            totalSold: { $sum: '$items.quantity' },
                            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                        }
                    },
                    { $sort: { totalSold: -1 } },
                    { $limit: 5 }
                ]),

                //9-daily revenue
                Order.aggregate([
                    {
                        $match: {
                            createdAt: { $gte: sevenDaysAgo },
                            status: { $ne: 'cancelled' }
                        }

                    },
                    {
                        $group: {
                            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            total: { $sum: '$totalPrice' },
                            revenue: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ])
            ])

            const orders = {
                total: 0,
                pending: 0,
                confirmed: 0,
                processing: 0,
                shipped: 0,
                delivered: 0,
                cancelled: 0,
                returned: 0
            }
            ordersByStatus.forEach(({ _id, count }) => {
                orders[_id] = count
                orders.total += count

            })
            const totalRevenues = totalRevenue[0]?.total || 0
            const thisMonthRevenue = thisMonthRevenueResult[0]?.total || 0
            const lastMonthRevenue = lastMonthRevenueResult[0]?.total || 0
            let growthPercentRate = lastMonthRevenue > 0
                ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0

            res.status(200).json({
                success: true,
                dashboard: {
                    totalCustomers,
                    totalAdmins,
                    totalProducts,
                    orders,
                    revenue: {
                        total: totalRevenues,
                        thisMonth: thisMonthRevenue,
                        lastMonth: lastMonthRevenue,
                        growthPercentRate
                    },
                    ordersByStatus,
                    topProducts,
                    dailyRevenue,
                    recentOrders,
                }
            });
        } catch (error) {
            next(error)
        }
    },

    //@ GET Carts by admin 
    //@ get/admin/carts
    //@ Auth Admin

    getCarts: async (req, res, next) => {
        try {
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 5, 1), 100)
            const skip = (page - 1) * limit
            const filter = { 'items.0': { $exists: true } }
            const [carts, totalItems] = await Promise.all([
                Cart.find(filter)
                    .populate('user', 'userName email')
                    .skip(skip)
                    .limit(limit)
                    .sort('-createdAt')
                    .lean(),
                Cart.countDocuments(filter)
            ]);
            res.status(200).json({
                success: true,
                message: `count of carts ${carts.length}`,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                },
                data: carts
            });
        } catch (error) {
            next(error)
        }
    },

    //@ GET Orders by admin 
    //@ get/admin/orders
    //@ Auth Admin

    getAllOrders: async (req, res, next) => {
        try {
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
            const skip = (page - 1) * limit
            const { status, paymentStatus, from, to, sort } = req.query
            let filter = {}
            if (status) filter.status = status
            if (paymentStatus) filter.paymentStatus = paymentStatus
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
            let sortBy = sort ? sort.split(',').join(' ') : '-createdAt'
            const [orders, total] = await Promise.all([
                Order.find(filter)
                    .populate('user', 'userName email')
                    .skip(skip)
                    .limit(Number(limit))
                    .sort(sortBy)
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

    //@ GET Order by admin 
    //@ get/admin/{id}
    //@ Auth Admin

    getSingleOrder: async (req, res, next) => {
        try {
            const order = await Order.findOne({
                _id: req.params.id, user: req.user.id
            }).populate('user', 'userName email phone').lean()
            if (!order) { return next(new AppError(constantMessages.ORDER_NOT_FOUND, 404)) }
            res.status(200).json({ success: true, data: order })
        } catch (error) {
            next(error)
        }
    },

    //@ GET Order by admin 
    //@ get/admin/{id}/status
    //@ Auth Admin

    updateOrderStatus: async (req, res, next) => {
        try {
            const { status, adminNote } = req.body
            const order = await Order.findById(req.params.id).populate('user', 'userName email')
            if (!order) return next(new AppError(constantMessages.ORDER_NOT_FOUND, 404))

            const validTransitions = {
                pending: ['confirmed', 'cancelled'],
                confirmed: ['processing', 'cancelled'],
                processing: ['delivered', 'cancelled'],
                delivered: ['returned'],
                cancelled: [],
                returned: []
            }
            const allowedTransition = validTransitions[order.status]
            if (!allowedTransition || !allowedTransition.includes(status)) {
                return next(new AppError('Cannot complete this status transition because it is not allowed', 400))
            }
            order.status = status
            if (status === 'delivered') order.deliveredAt = Date.now()
            if (status === 'cancelled') {
                order.cancelledAt = Date.now()
                // if the order is cancelled restore the stock 
                for (const item of order.items) {
                    const product = await Product.findOneAndUpdate(
                        { _id: item.product },
                        { $inc: { stock: item.quantity } },
                    )
                }
                if (paymentStatus === 'paid') {
                    order.paymentStatus = 'refunded'
                }
            }
            await order.save()
            try {
                const emailMessage = `
                Hi ${order.user.userName},
 
                Your order status has been updated.
 
                Order ID: ${order._id}
                New Status: ${status}
                ${adminNote ? `Note from our team: ${adminNote}` : ''}
            `
                await sendEmail({
                    to: order.user.email,
                    subject: 'Your Order Status Has Been Updated',
                    text: emailMessage
                })
            } catch (error) {
                console.error('Order status email could not be sent:', error.message);
            }
            res.status(200).json({ success: true, data: order })
        } catch (error) {
            next(error)
        }
    },

    //@ GET Wishlists by admin 
    //@ get/admin/all
    //@ Auth Admin

    getAllWishLists: async (req, res, next) => {
        try {
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 5, 1), 100)
            const skip = (page - 1) * limit
            const [wishlists, totalItems] = await Promise.all([
                WishList.find()
                    .populate('user', 'userName email')
                    .skip(skip)
                    .limit(limit)
                    .sort('-createdAt')
                    .lean(),
                WishList.countDocuments()
            ]);
            res.status(200).json({
                success: true,
                message: `count of wishlists ${wishlists.length}`,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                },
                data: wishlists
            });
        } catch (error) {
            next(error)
        }
    },

    //@ GET Wishlist stats by admin 
    //@ get/admin/stats
    //@ Auth Admin

    wishListsStats: async (req, res, next) => {
        try {
            const stats = await WishList.aggregate([
                { $unwind: '$products' },
                { $group: { _id: '$products', count: { $sum: 1 } } },
                { $sort: { count: 1 } },
                { $limit: 5 },
                {$lookup:{
                    from:'products',
                    localField:'_id',
                    foreignField:'_id',
                    as:'products_Details'
                }},
                { $unwind: '$products_Details' },
                {$project:{
                    _id:1,
                    name:'$products_Details.name',
                    count:1,
                    price:'$products_Details.price'
                }}
            ])
            res.status(200).json({ success: true, data: stats })
        } catch (error) {
            next(error)
        }
    }

}

module.exports = adminController