const mongoose = require('mongoose')
const { boolean, required } = require('joi')
const Schema = mongoose.Schema


// @ Handle Cart Items

const cartItems = new Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: "product", required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 }
}, { _id: false })

// @ Creating the Cart model
const cartSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true
    },

    items: [cartItems],

    coupon: {
        code: {
            type: String, uppercase: true
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
        },
        discountValue: { type: Number }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})


// Virtuals for calculations

//@ subtotal (virtual)
cartSchema.virtual('subtotal').get(function () {
    return this.items.reduce((sum, current) => sum + (current.price * current.quantity), 0)
})

//@ discountAmount(virtual)
cartSchema.virtual('discountAmount').get(function () {
    if (!this.coupon || !this.coupon.code) {
        return 0
    }
    if (this.coupon.discountType === 'percentage') {
        return (this.subtotal * this.coupon.discountValue) / 100
    }
    if (this.coupon.discountType === 'fixed') {
        return this.coupon.discountValue
    }
    return 0
})

//@ total (virtual)
cartSchema.virtual('total').get(function(){
    return this.subtotal - this.discountAmount
})

//@ itemCount (virtual)
cartSchema.virtual('itemCount').get(function(){
    return this.items.reduce((count, item) => count + item.quantity, 0)
})

const Cart = mongoose.model('cart', cartSchema)
module.exports = Cart