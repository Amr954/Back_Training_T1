const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')
const { boolean } = require('joi')
const Schema = mongoose.Schema

const addressSchema = new Schema({
    fullName: String,
    phone: String,
    country: String,
    city: String,
    street: String,
    postalCode: String,
}, { _id: false })

const userSchema = new Schema({

    userName: {
        type: String,
        trim: true,
        required: true
    },

    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },

    password: {
        type: String,
        trim: true,
        required: true,
        minlength: 8
    },

    phone: {
        type: String,
    },

    avatar: {
        url: { type: String },
        publicId: { type: String }
    },

    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: "customer"
    },

    addresses: [addressSchema],

    wishlist: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product'
        }],

    tokens: [
        {
            type: String,
            expires: '30m',
            trim: true,
            required: true,
        }],

    isVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date }
})

userSchema.pre('save', async function () {
    try {
        const user = this
        if (!user.isModified('password')) {
            return;
        }
        user.password = await bcryptjs.hash(user.password, 8)
    }
    catch (err) {
        console.error(err);
    }
})

userSchema.methods.compareUserPass = async function (pass) {
    const user = this
    return await bcryptjs.compare(pass, user.password)
}

const User = mongoose.model('user', userSchema)
userSchema.index({ userName: 1 });
userSchema.index({ role: 1 });
module.exports = User