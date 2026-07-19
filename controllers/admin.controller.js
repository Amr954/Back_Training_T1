const Order = require('../models/order.model')
const Cart = require('../models/cart.model')
const Product = require('../models/product.model')
const WishList = require('../models/wishlist.model')
const User = require('../models/user.model')
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants')
const sendEmail = require('../utils/sendEmail')

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
                Order.find().sort('-createdAt').limit(5).populate('user', 'username').lean(),

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
    }
}

module.exports = adminController