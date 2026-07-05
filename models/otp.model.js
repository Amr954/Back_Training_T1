const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')
const { required } = require('joi')
// const { boolean } = require('joi')
const Schema = mongoose.Schema

const otpSchema = new Schema({
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    otp: {type: String, required: true},
    expiresAt: {type: Date, required:true, index: { expires: 0 }},
    userData: {type: Object}
})

otpSchema.pre('save', async function(next){
    try {
        if(this.isModified('otp')){
            const salt = await bcryptjs.genSalt(8)
            console.log(salt)
            this.otp= await bcryptjs.hash(this.otp,salt)
        }
    }
    catch (err) {
       console.error(err);
    }
})

otpSchema.methods.compareOtp = async function (enteredOtp) {
    return await bcryptjs.compare(enteredOtp, this.otp);
};

const OTP = mongoose.model('OTP', otpSchema)
module.exports = OTP;