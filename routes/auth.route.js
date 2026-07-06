const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.control')
const {
    newUserSchema, 
    logInSchema, 
    verifyOtpSchema, 
    forgotPasswordSchema, 
    resetPasswordSchema, } = require('../validation/auth.Validation')
const validate = require('../middleware/validate.middleware')
const { authentication } = require('../middleware/auth.middleware')

router.post('/register/send-otp',validate(newUserSchema),authController.sendOtp)
router.post('/verify-otp',validate(verifyOtpSchema) ,authController.verifyOtp)
router.post('/login',validate(logInSchema),authController.logIn)
router.post("/forgot-password/send-otp", validate(forgotPasswordSchema),authController.forgotPassword)
router.post("/forgot-password/verify-otp", validate(resetPasswordSchema),authController.resetPassword)
router.get('/me', authentication,authController.getUser)
router.post("/logout",authentication,authController.logOut);
router.post('/refresh', authController.refresh)


module.exports = router