const Product = require('../models/product.model')
const loggerEvent = require('../services/logger.service')
const { log } = require('winston')
const logger = loggerEvent('user')
const cloudinary = require('../.config/cloudinary')
const uploadToCloudinary = require('../utils/uploadToCloudinary')

// Uploads multiple files in parallel and shapes each result to match
// the Product schema's images field: { url, publicId }
const uploadImages = async (files, folder = 'products') => {
    const uploadResults = await Promise.all(
        files.map(file => uploadToCloudinary(file.buffer, folder))
    )

    return uploadResults.map(result => ({
        url: result.secure_url,
        publicId: result.public_id
    }))
}

/*************** 
  @ Handle product Controller
 ***************/

const productController = {
    // @ Get /products
    getAllProducts: async (req, res) => {
        try {
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
            const skip = (page - 1) * limit
            const { category, brand, minPrice, maxPrice, sort } = req.query
            const filter = { isActive: true }

            if (category) { filter.category = category.toLowerCase() }
            if (brand) { filter.brand = brand }

            if (minPrice || maxPrice) {
                filter.price = {}
                if (minPrice) filter.price.$gte = Number(minPrice)
                if (maxPrice) filter.price.$lte = Number(maxPrice)
            }

            const sortBy = sort ? sort.split(',').join(' ') : '-createdAt'
            const [products, totalItems] = await Promise.all([
                Product.find(filter)
                    .sort(sortBy)
                    .skip(skip)
                    .limit(limit),
                Product.countDocuments(filter)
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
        } catch (err) {
            logger.error(err.message)
            res.status(500).send({
                message: err.message
            })
        }

    },

    // @ Get /products/search

    searchProducts: async (req, res) => {
        try {
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const skip = (page - 1) * limit
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100)
            const { text, category, brand, minPrice, maxPrice, sort, tags, subategory } = req.query
            const q = { isActive: true }

            if (text) {
                q.$text = { $search: text }
            }
            if (category) { q.category = category.toLowerCase() }
            if (brand) { q.brand = brand }
            if (subcategory) { q.subategory = subategory.toLowerCase() }
            if (tags) {
                const tagList = Array.isArray(tags) ? tags : tags.split(',')
                q.tags = { $in: tagList }
            }

            if (minPrice || maxPrice) {
                q.price = {}
                if (minPrice) q.price.$gte = Number(minPrice)
                if (maxPrice) q.price.$lte = Number(maxPrice)
            }
            const sortBy = sort ? sort.split(',').join(' ') : '-createdAt'
            let projection = {}
            if (text && !sort) {
                projection = { score: { $meta: 'textScore' } }
                sortBy = { score: { $meta: 'textScore' } }
            }
            const [products, total] = await Promise.all([
                Product.find(q)
                    .sort(sortBy)
                    .skip(skip)
                    .limit(limit),
                Product.countDocuments(q)
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
        } catch (err) {
            logger.error(err.message)
            res.status(500).send({
                message: err.message
            })
        }
    },
    // @desc    Get a single product by ID
    // @route   GET /products/:id
    // @auth  Public

    getProduct: async (req, res) => {
        try {
            const product = await Product.findById(req.params.id).lean()
            if (!product) {
                return res.status(404).json({ message: "Product not found" })
            }
            res.status(200).json({ success: true, data: product })
        } catch (err) {
            logger.error(err.message)
            res.status(400).send({
                message: err.message
            })
        }
    },

    // @desc    Create products
    // @route   POST /products
    // @auth  Admin

    createProduct: async (req, res, next) => {
        try {
            req.body.createdBy = req.user.id

            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ success: false, message: 'At least one product image is required' })
            }

            req.body.images = await uploadImages(req.files)

            // tags can arrive as "red,summer" (form-data sends strings) or already as an array
            if (req.body.tags && typeof req.body.tags === 'string') {
                req.body.tags = req.body.tags.split(',').map(t => t.trim())
            }

            const product = await Product.create(req.body)
            res.status(201).json({ success: true, data: product })
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
            if (!product) { return res.status(404).json({ message: "Product not found." }) }
            if (product.images?.length) {
                await Promise.all(
                    product.images.map(image => cloudinary.uploader.destroy(image.publicId))
                )
            }
            await Product.deleteOne({ _id: req.params.id })

            res.status(200).json({ success: true, data: {} })
        } catch (error) {
            next(error)
        }
    }
}

module.exports = productController