const WishList = require('../models/wishlist.model')
const Product = require('../models/product.model')
const AppError = require('../services/AppError.service');
const constantMessages = require('../services/constants');

const getWishListOrCreateIt = async (req) => {
    const userWishList = await WishList.findOneAndUpdate(
        { user: req.user.id },
        { $setOnInsert: { user: req.user.id, products: [] } },
        { new: true, upsert: true }
    )
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
            if (!product.isActive) return next(new AppError(constantMessages.PRODUCT_INACTIVE, 400));

            const wishlist = await WishList.findOneAndUpdate(
                { user: req.user.id },
                {
                    $addToSet: { products: req.params.productId },
                    $setOnInsert: { user: req.user.id }
                },
                { new: true, upsert: true }
            )
            await wishlist.save()

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
            const wishlist = await WishList.findOneAndUpdate(
                { user: req.user.id },
                { $pull: { products: req.params.productId } },
                { new: true }
            )
            if (!wishlist) {
                return next(new AppError(constantMessages.WISHLIST_NOT_FOUND, 404))
            }
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
            const wishlist = await WishList.findOneAndUpdate(
                { user: req.user.id },
                { $set: { products: [] } },
                { new: true }
            )
            if (!wishlist) {
                return next(new AppError(constantMessages.WISHLIST_NOT_FOUND, 404))
            }
            await wishlist.save()

            res.status(200).json({ success: true, data: wishlist });
        } catch (error) {
            next(error)
        }
    }
}

module.exports = wishListController
