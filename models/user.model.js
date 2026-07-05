const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')
const { boolean } = require('joi')
const Schema = mongoose.Schema

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
        type: String
    },

    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: "customer"
    },

    addresses: {
        type: String
    },

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

    isVerified:{type: Boolean,default:false},
    resetPasswordToken:{type: String},
    resetPasswordExpires:{type: Date}
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
const User = mongoose.model('user', userSchema)
module.exports =  User