const mongoose = require('mongoose')
const { boolean, required } = require('joi')
const Schema = mongoose.Schema


const orderItemsSchema = new Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, }
}, { _id: false })

const orderSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    items: {
        type: [orderItemsSchema],
        required: true,
        validate: [v => v.length > 0, 'Order must contain 1 item']
    },
    shippingAddress: {
        phone: { type: String, required: true },
        country: { type: String, required: true },
        city: { type: String, required: true },
        address: { type: String, required: true },
        postalCode: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'stripe',],
        default: 'cash'
    },

    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },

    transactionId: {
        type: String,
        trim: true
    },

    subtotal: {
        type: Number,
        required: true
    },

    shippingFee: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    discount: {
        type: Number,
        default: 0
    },

    totalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
        default: 'pending'
    },
    paidAt: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    customerNote: { type: String, maxlength: 1000 },
    adminNote: { type: String, maxlength: 1000 },
    // createdAt: { type: Date, default: Date.now() }
},{timestamps:true})

orderSchema.index({ createdAt: -1 })

const Order = mongoose.model('order', orderSchema)

module.exports = Order