const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.control')
const {newUserValidation , loginValidation} = require('../validation/auth.Validation')
const { authentication } = require('../middleware/auth.middleware')

router.post('/register/send-otp',newUserValidation,authController.sendOtp)
router.post('/verify-otp', authController.verifyOtp)
router.post('/login',loginValidation,authController.logIn)
router.post("/forgot-password/send-otp", authController.forgotPassword)
router.post("/forgot-password/verify-otp", authController.resetPassword)
router.get('/me', authentication,authController.getUser)
router.post("/logout",authentication,authController.logOut);
router.post('/refresh', authController.refresh)


module.exports = router