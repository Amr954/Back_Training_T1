const WishList = require('../models/wishlist.model')
const Product = require('../models/product.model')
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants');

const getWishListOrCreateIt = async (req) => {
    let userWishList = await WishList.findOne({ user: req.user.id })
    if (!userWishList) {
        userWishList = await WishList.create({ user: req.user.id, products: [] })
    }
    return userWishList
}

//@ desc    Get user's wishlist
//@ route   GET /wishlists/my
//@ Auth User

const wishListController = {
    getWishLists: async (req, res, next) => {
        try {
            const wishlist = await getWishListOrCreateIt(req);
            res.status(200).json({ success: true, data: wishlist });
        } catch (error) {
            next(error)
        }
    },

    //@ POST add to wishList
    //@ route post/wishlist/add/:productId
    //@ Auth User

    addToWishList: async (req, res, next) => {
        try {
            const product = await Product.findById(req.params.productId)
            if (!product) { return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404)) }
            let wishlist = await WishList.findOne({ user: req.user._id });
            if (!wishlist) {
                wishlist = await WishList.create({ user: req.user._id, products: [] });
            }
            const exist = wishlist.products.find((item) => item._id.toString() === req.params.productId)
            if (exist) {
                console.log(wishlist.products);
                return next(new AppError(constantMessages.PRODUCT_IN_WISHLIST, 400))
            }
            wishlist.products.push(req.params.productId)
            await wishlist.save()
            // await wishlist.populate('products', 'name images price discountPrice slug')
            res.status(200).json({ success: true, message: "Added to wishlist", data: wishlist });
        } catch (error) {
            next(error)
        }
    },

    //@ DELETE from wishList
    //@ route post/wishlist/remove/:productId
    //@ Auth User

    removeFromWishList: async (req, res, next) => {
        try {
            const wishlist = await WishList.findOne({ user: req.user.id })
            if (!wishlist) {
                return next(new AppError(constantMessages.WISHLIST_NOT_FOUND, 404))
            }
            wishlist.products = wishlist.products.filter((item) => item._id.toString() !== req.params.productId)
            await wishlist.save();

            res.status(200).json({ success: true, data: wishlist });
        } catch (error) {
            next(error)
        }
    },

    //@ DELETE all items in wishlist
    //@ route delete/wishlist/clear
    //@ Auth User

    clearWishList: async (req, res, next) => {
        try {
            const wishlist = await WishList.findOne({ user: req.user.id })
            if (!wishlist) {
                return next(new AppError(constantMessages.WISHLIST_NOT_FOUND, 404))
            }
            wishlist.products = []
            await wishlist.save()

            res.status(200).json({ success: true, data: wishlist });
        } catch (error) {
            next(error)
        }
    }
}

module.exports = wishListController
