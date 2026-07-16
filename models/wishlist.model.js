const mongoose = require('mongoose')
const { boolean, required } = require('joi')
const Schema = mongoose.Schema

const wishListSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
        unique: true,
        index : true
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'product',
        }
    ]
},{ timestamps: true })

wishListSchema.pre(/^find/,function(){
    this.populate({
        path:"products", 
        select:'name images price discountPrice slug'
    })
})

const WishList = mongoose.model('wishlist', wishListSchema)
module.exports = WishList