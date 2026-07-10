const mongoose = require('mongoose')
const { boolean, required } = require('joi')
const slugify = require('slugify')
const Schema = mongoose.Schema

// @ Creating the product schema with pre hooks.

const userReview = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    }
}, { timestamps: true })

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        maxlength: 200
    },

    slug: {
        type: String
    },

    shortDescription: {
        type: String,
        maxlength: 500,
        required: true,
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    discountPrice: {
        type: Number,
        default: 0
    },

    stock: {
        type: Number,
        required: true,
        min: 0
    },

    sku: {
        type: String
    },

    images: {
        type: [{
            url: { type: String, required: true },
            publicId: { type: String, required: true }
        }]
    },

    category: {
        type: String,
        required: true,
        lowercase: true
    },

    subcategory: {
        type: String,
    },

    brand: { type: String, },

    tags: [{
        type: String
    }],

    reviews: [userReview],

    averageRating: { type: Number },

    numReviews: { type: Number, default: 0 },

    featured: {
        type: Boolean,
        default: false
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    }
}, { timestamps: true })

// @ Text indexes

productSchema.index({
    name: "text",
    description: "text",
    brand: "text",
});
productSchema.index({ category: 1, brand: 1, price: 1, averageRating: -1, createdAt: -1 })

// @ Pre save hook

productSchema.pre('save', async function () {
    try {
        const product = this
        if (product.isModified('name')) {
            product.slug = slugify(product.name, { lower: true, strict: true })
        }
    }
    catch (err) {
        console.error(err);
    }
})

productSchema.methods.calcAverageRating = function () {
    const product = this
    if (product.reviews.length === 0) {
        product.averageRating = 0
        product.numReviews = 0
    } else {
        const sumRating = product.reviews.reduce((acc, current) => current.rating + acc, 0)
        product.averageRating = sumRating / product.reviews.length
        product.numReviews = product.reviews.length
    }
}

const Product = mongoose.model('product', productSchema)
module.exports = Product