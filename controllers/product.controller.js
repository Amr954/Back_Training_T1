const Product = require('../models/product.model')
const loggerEvent = require('../services/logger.service')
const { log } = require('winston')
const logger = loggerEvent('product')
const cloudinary = require('../.config/cloudinary')
const uploadToCloudinary = require('../utils/uploadToCloudinary')
const AppError = require('../services/AppError.service')
const constantMessages = require('../services/constants')
// Uploads multiple files in parallel and shapes each result to match
// the Product schema's images field: { url, publicId }
/*
Achiveing Atomicty (مبدا الذرية كله مع بعض او لا):
   If ANY file fails to upload, we roll back the ones
that DID succeed (delete them from Cloudinary) and throw — so a caller
never ends up with a partial set of images silently saved.
it's similar as financial transaction.
*/

const uploadImages = async (files, folder = 'products') => {
    const uploaded = []
    try {
        await Promise.all(
            files.map(async (file) => {
                const uploadResult = await uploadToCloudinary(file.buffer, folder)
                uploaded.push(uploadResult)
                return uploadResult
            })
        )
        return uploaded.map(result => ({
            url: result.secure_url,
            publicId: result.public_id
        }))

    } catch (error) {
        if (uploaded.length > 0) {
            await Promise.allSettled(
                uploaded.map(image => cloudinary.uploader.destroy(image.publicId))
            )
        }
        throw error
    }

}

/*************** 
  @ Handle product Controller
 ***************/

const productController = {
    // @ Get /products

    getProducts: async (req, res, next) => {
        try {
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
            const skip = (page - 1) * limit
            const { q, category, brand, minPrice, maxPrice, sort, tags, subcategory } = req.query
            const filter = { isActive: true }
            if (q) {
                filter.$text = { $search: q }
            }
            if (category) { filter.category = category.toLowerCase() }
            if (subcategory) { filter.subcategory = subcategory }
            if (brand) { filter.brand = brand }

            if (tags) {
                // const tagList = Array.isArray(tags) ? tags : tags.split(',')
                filter.tags = tags
            }
            if (minPrice || maxPrice) {
                filter.price = {}
                if (minPrice) filter.price.$gte = Number(minPrice)
                if (maxPrice) filter.price.$lte = Number(maxPrice)
            }

            let sortBy = { createdAt: -1 }
            switch (req.query.sort) {
                case "price":
                    sortBy = { price: 1 };
                    break;
                case "-price":
                    sortBy = { price: -1 };
                    break;
                case "rating":
                    sortBy = { averageRating: -1 };
                    break;
                case "newest":
                    sortBy = { createdAt: -1 };
                    break;
                case "oldest":
                    sortBy = { createdAt: 1 };
                    break;
            }
            let projection = {}
            if (q && !sort) {
                projection = { score: { $meta: 'textScore' } }
                sortBy = { score: { $meta: 'textScore' } }
            }
            const [products, totalItems] = await Promise.all([
                Product.find(filter)
                    .sort(sortBy)
                    .skip(skip)
                    .limit(limit),
                Product.countDocuments(filter, projection)
            ]);
            res.status(200).json({
                success: true,
                message: `count of products ${products.length}`,
                data: products,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                }
            });
        } catch (error) {
            next(error)
        }

    },

    // @desc    Get a single product by ID
    // @route   GET /products/:id
    // @auth  Public

    getProduct: async (req, res, next) => {
        try {
            const product = await Product.findOne({ _id: req.params.id, isActive: true }).lean()
            if (!product) {
                return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404))
            }
            res.status(200).json({ success: true, data: product })
        } catch (err) {
            logger.error(err.message)
            next(err)
        }
    },

    // @desc    Create products
    // @route   POST /products
    // @auth  Admin

    createProduct: async (req, res, next) => {
        try {
            req.body.createdBy = req.user.id

            const existingSku = await Product.findOne({ sku: req.body.sku })
            if (existingSku) {
                return next(new AppError(constantMessages.PRODUCT_SKU_CHECK, 400))
            }
            if (req.body.discountPrice && Number(req.body.discountPrice) >= Number(req.body.price)) {
                return res.status(400).json({ success: false, message: 'Discount price must be less than price' })
            }

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one product image is required' })
            }
            req.body.images = await uploadImages(req.files)

            // tags can arrive as "red,summer" (form-data sends strings) or already as an array
            if (req.body.tags && typeof req.body.tags === 'string') {
                req.body.tags = req.body.tags.split(',').map(t => t.trim())
            }

            const product = new Product(req.body)
            await product.save()
            res.status(201).json({ success: true, data: product })
        } catch (error) {
            next(error)
        }
    },

    // @desc    Update product
    // @route   PATCH /products
    // @auth  Admin

    updateProduct: async (req, res, next) => {
        try {
            const product = await Product.findById(req.params.id)
            if (!product) {
                return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404))
            }

            const allowedFields = [
                'name', 'shortDescription', 'description', 'price', 'discountPrice',
                'stock', 'sku', 'category', 'subcategory', 'brand',
                'featured', 'isActive'
            ];
            const updates = {}
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field]
                }
            })
            if (req.body.sku && req.body.sku !== product.sku) {
                const existingSku = await Product.findOne({
                    sku: req.body.sku,
                    _id: { $ne: product._id } //هعمل تشيك علي كل المنتجات التانية ما عدا المنتج اللي بغير فيه
                })
                if (existingSku) {
                    return next(new AppError(constantMessages.PRODUCT_SKU_CHECK, 400))
                }
            }
            if (req.body.tags !== undefined) {
                updates.tags = typeof req.body.tags === 'string'
                    ? req.body.tags.split(',').map(t => t.trim())
                    : req.body.tags
            }
            const hasNewImages = req.files?.length > 0
            const hasImageDeletions = !!req.body.imagesToDelete
            if (Object.keys(updates).length === 0 && !hasNewImages && !hasImageDeletions) {
                return next(new AppError('No valid fields provided to update', 400))
            }

            Object.assign(product, updates)
            await product.validate()

            const publicIDs = product.images.map(img => img.publicId)

            // upload images first 
            if (req.files?.length) {
                const newImages = await uploadImages(req.files)
                product.images.push(...newImages)
            }
            if (req.body.imagesToDelete) {
                let idToDelete;
                try {
                    idToDelete = JSON.parse(req.body.imagesToDelete)

                } catch (error) {
                    return next(error)
                };
                if (!Array.isArray(idToDelete)) {
                    return res.status(400).json({ message: "imagesToDelete must be an array" })
                }
                const validIdToDelete = idToDelete.filter(id => publicIDs.includes(id))

                if (validIdToDelete.length > 0) {
                    await Promise.allSettled(
                        validIdToDelete.map((publicId => cloudinary.uploader.destroy(publicId)))
                    )
                    product.images = product.images.filter(img => !validIdToDelete.includes(img.publicId))
                }
            }

            if (product.images.length === 0) {
                return res.status(400).json({ message: 'Product must have at least one image' })
            }

            await product.save()
            res.status(200).json({ success: true, data: product })

        } catch (error) {
            next(error)
        }
    },

    // @desc    Delete product
    // @route   DELETE /products
    // @auth  Admin

    deleteProduct: async (req, res, next) => {
        try {
            const product = await Product.findById(req.params.id)
            if (!product) { return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404)) }
            if (product.images?.length) {
                await Promise.all(
                    product.images.map(image => cloudinary.uploader.destroy(image.publicId))
                )
            }
            product.isActive = false;
            await product.save()
            // await Product.deleteOne({ _id: req.params.id })

            res.status(200).json({ success: true, data: {} })
        } catch (error) {
            next(error)
        }
    },

    // @desc    ADD review to product
    // @route   POST /review
    // @auth  User

    addReview: async (req, res, next) => {
        try {
            const id = req.params.id
            const product = await Product.findById(id)
            if (!product) {
                return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404))
            }
            if (!product.isActive) {
                return next(new AppError(constantMessages.PRODUCT_INACTIVE, 400))
            }

            const reviewedAlready = product.reviews.find(review => review.user.toString() === req.user.id)
            if (reviewedAlready) { return next(new AppError(constantMessages.PRODUCT_ALREADY_REVIEWED, 400)) }
            const { rating, comment } = req.body
            const numRate = Number(rating)
            if (!rating || !comment) {
                { return res.status(400).json({ message: "These fields are required." }) }
            }

            if (isNaN(numRate)) {
                return res.status(400).json({ message: 'Rating must be a number' });
            }

            if (numRate > 5 || numRate < 1) {
                { return res.status(400).json({ message: "Rating must be between 1 and 5." }) }
            }

            const userReview = { user: req.user.id, rating: numRate, comment }
            product.reviews.push(userReview)
            product.calcAverageRating()
            await product.save()
            res.status(201).json({ success: true, data: product })
        } catch (error) {
            next(error)
        }
    },

    // @desc    DELETE review
    // @route   DELETE /:id/reviews/:rid
    // @auth  User/Admin

    deleteReview: async (req, res, next) => {
        try {
            const id = req.params.id
            const product = await Product.findById(id)
            if (!product) {
                return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404))
            }
            const existingReview = product.reviews.id(req.params.rid)
            if (!existingReview) { return next(new AppError(constantMessages.REVIEW_NOT_FOUND, 404)) }
            const owner = existingReview.user.toString() === req.user.id
            const admin = req.user.role === "admin"
            if (!owner && !admin) {
                return next(new AppError(constantMessages.NOT_AUTHORIZED_REVIEW, 403))
            }
            product.reviews = product.reviews.filter(r => r._id.toString() !== req.params.rid)
            product.calcAverageRating()
            await product.save()
            res.status(200).json({ success: true, data: {} })
        } catch (error) {
            next(error)
        }
    },

    // @desc    GET reviews
    // @route   GET /:id/reviews
    // @auth  Public

    getReviews: async (req, res, next) => {
        try {
            const id = req.params.id
            const product = await Product.findById(id).select('reviews').lean()
            if (!product) {
                return next(new AppError(constantMessages.PRODUCT_NOT_FOUND, 404))
            }
            res.status(200).json({ success: true, data: product.reviews })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = productController