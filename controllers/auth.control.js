const User = require('../models/user.model')
const OTP = require('../models/otp.model')
const bcryptjs = require('bcryptjs')
const loggerEvent = require('../services/logger.service')
const { log } = require('winston')
const logger = loggerEvent('user')
const jwt = require('jsonwebtoken')
const crypto = require("crypto")
const { generateAccessToken, generateRefreshToken, cookieOptions, generateResetToken } = require("../utils/tokens");
const generateOtp = require('../utils/generateOTP')
const sendEmail = require('../utils/sendEmail')
const { URL } = require("url")
const AppError = require('../services/AppError.service')
const constantMessages = require('../services/constants')


function buildResetUrl(baseUrl, token, email) {
    const resetUrl = new URL("/reset-password", baseUrl)
    resetUrl.searchParams.set("token", token)
    resetUrl.searchParams.set("email", email)
    return resetUrl.toString()
}
const OTP_EXPIRY_MINUTES = 5

const userController = {

    // POST /auth/register/send-otp
    sendOtp: async (req, res, next) => {
        try {
            const { email } = req.body
            logger.info(email)

            const existingUser = await User.findOne({ email })
            if (existingUser) {
                return next(new AppError(constantMessages.USER_ALREADY_EXISTS, 400))
            }

            const otpCode = generateOtp()
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

            let otpDoc = await OTP.findOne({ email })
            if (otpDoc && otpDoc.expiresAt.getTime() > Date.now()) {
                return res.status(400).send({
                    message: "OTP has been sent to your email already check it."
                })
            }
            if (otpDoc) {
                otpDoc.otp = otpCode
                otpDoc.expiresAt = expiresAt
                otpDoc.userData = req.body
            } else {
                otpDoc = new OTP({
                    email,
                    otp: otpCode,
                    expiresAt,
                    userData: req.body
                })
            }
            await otpDoc.save()

            await sendEmail({
                to: email,
                subject: "Verify your email - TEcommerceApi",
                text: `Your verification code is ${otpCode}. It expires in ${OTP_EXPIRY_MINUTES} minutes.`
            })

            res.status(200).send({
                message: constantMessages.OTP_SENT
            })
        }
        catch (err) {
            logger.error(err.message)
            next(err)
        }
    },

    // POST /auth/verify-otp
    verifyOtp: async (req, res, next) => {
        try {
            const { email, otp } = req.body
            logger.info(email)

            const otpDoc = await OTP.findOne({ email })
            if (!otpDoc) {
                return res.status(400).send({
                    message: "OTP not found or expired, please request a new one"
                })
            }

            if (otpDoc.expiresAt.getTime() < Date.now()) {
                await OTP.deleteOne({ email })
                return res.status(400).send({
                    message: "OTP expired, please request a new one"
                })
            }

            const isMatch = await otpDoc.compareOtp(otp)
            if (!isMatch) {
                return res.status(400).send({
                    message: constantMessages.INVALID_OTP
                })
            }

            const newUser = new User(otpDoc.userData)
            newUser.isVerified = true
            await newUser.save()

            await OTP.deleteOne({ email })

            res.status(201).send({
                message: "Account verified and created successfully !!"
            })
        }
        catch (err) {
            logger.error(err.message)
            res.status(400).send({
                message: err.message
            })
        }
    },

    logIn: async (req, res, next) => {
        try {
            const { email, password } = req.body

            if (!email || !password) return next(new AppError('Please provide email and password', 400));
            const user = await User.findOne({ email })
            if (!user) {
                return next(new AppError(constantMessages.INVALID_CREDENTIALS, 401));
            }
            if (!user.isVerified) return next(new AppError(constantMessages.EMAIL_NOT_VERIFIED, 403));
            
            const isMatch = await bcryptjs.compare(password, user.password)
            if (!isMatch) {
                return next(new AppError(constantMessages.INVALID_CREDENTIALS, 401));
            }

            const accessToken = generateAccessToken(user)
            const refreshToken = generateRefreshToken(user)

            // res.cookie("access_token", accessToken, cookieOptions.access)
            res.cookie("refresh_token", refreshToken, cookieOptions.refresh)

            user.tokens.push(refreshToken)
            await user.save()

            res.status(200).json({
                message: "Logged in successfully",
                accessToken,
                user
            })

        } catch (err) {
            logger.error(err.message)
            next(err)
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body
            const user = await User.findOne({ email })
            if (!user) {
                return res.status(200).send({ message: "if this email exists, a reset link has been sent" })
            }
            const { rawToken, hashedToken } = generateResetToken()

            user.resetPasswordToken = hashedToken
            user.resetPasswordExpires = Date.now() + 5 * 60 * 1000

            await user.save()

            const resetUrl = buildResetUrl(process.env.FRONTEND_URL, rawToken, email)
            console.log("RESET URL:", resetUrl) // TEMPORARY — remove once email is wired up

            await sendEmail({
                to: email,
                subject: "Reset your password",
                html: `<p>Click here to reset your password:</p><a href="${resetUrl}">${resetUrl}</a><p>This link expires in 5 minutes.</p>`
            })

            res.status(200).send({ message: "if this email exists, a reset link has been sent" })

        } catch (error) {
            logger.error(err.message)
            res.status(500).send({ message: err.message })
        }
    },

    resetPassword: async (req, res, next) => {
        try {
            const { token, newPassword } = req.body
            console.log("BODY:", req.body)

            const hashedIncomingToken = crypto.createHash("sha256").update(token).digest("hex")
            const user = await User.findOne({
                resetPasswordToken: hashedIncomingToken,
                resetPasswordExpires: { $gt: Date.now() }
            })
            if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
                return res.status(400).send({ message: "invalid or expired reset link" })
            }

            if (user.resetPasswordExpires < Date.now()) {
                return res.status(400).send({ message: "reset link expired" })
            }

            if (hashedIncomingToken !== user.resetPasswordToken) {
                // console.log("FAILED AT CHECK 2 - TOKEN MISMATCH")
                return res.status(400).send({ message: "invalid or expired reset link" })
            }

            user.password = newPassword
            user.resetPasswordToken = undefined
            user.resetPasswordExpires = undefined
            user.tokens = []

            await user.save()

            res.status(200).send({ message: "password reset successfully" })

        } catch (err) {
            logger.error(err.message)
            res.status(500).send({ message: err.message })
        }
    },

    refresh: async (req, res, next) => {
        try {
            console.log("cookies received:", req.cookies)
            const refreshToken = req.cookies?.refresh_token
            if (!refreshToken) {
                return res.status(401).send({ message: "no refresh token provided" })
            }
            let decoded;
            try {
                decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
            } catch (err) {
                return res.status(403).send({ message: "refresh token expired or invalid" })
            }

            const user = await User.findById(decoded.id)
            if (!user || !user.tokens.includes(refreshToken)) {
                return res.status(403).send({ message: constantMessages.INVALID_TOKEN })
            }

            // rotate: remove old, issue new pair
            user.tokens = user.tokens.filter(t => t !== refreshToken)
            const newAccessToken = generateAccessToken(user)
            const newRefreshToken = generateRefreshToken(user)
            user.tokens.push(newRefreshToken)
            await user.save()

            // res.cookie("access_token", newAccessToken, cookieOptions.access)
            res.cookie("refresh_token", newRefreshToken, cookieOptions.refresh)

            res.status(200).json({
                message: "token refreshed",
                newAccessToken
            })
        } catch (err) {
            logger.error(err.message)
            next(err)
        }
    },

    getUser: async (req, res, next) => {
        try {
            let user = await User.findById(req.user._id)
            res.send(user)
        } catch (err) {
            logger.error(err.message)
            res.status(500).send({
                message: err.message
            })
        }
    },

    logOut: async (req, res, next) => {
        try {
            const refreshToken = req.cookies?.refresh_token
            if (refreshToken) {
                const decoded = jwt.decode(refreshToken)
                if (decoded?.id) {
                    await User.findByIdAndUpdate(decoded.id, {
                        $set: { tokens: [] }
                    })
                }
            }
            res.clearCookie("refresh_token")
            res.status(200).send({ message: constantMessages.LOGGED_OUT})
        } catch (err) {
            logger.error(err.message)
            next(err)
        }
    },

    changeUserRole: async (req, res, next) => {
        try {
            const { role } = req.body
            if (req.user.role === req.params.role) {
                 return next(new AppError(constantMessages.USER_CANNOT_CHANGE_OWN_ROLE, 400));
            }
            const user = await User.findByIdAndUpdate(req.params.id,
                { role },
                { new: true, runValidators: true }
            ).select('-password -tokens -resetPasswordToken -resetPasswordExpires')
            if (!user) {
                return next(new AppError(constantMessages.USER_NOT_FOUND,404))
            }
            res.status(200).json({
                success: true,
                message: `Role updated to ${role} for user ${user.userName}`,
                data: user
            })
        } catch (err) {
            logger.error(err.message)
            next(err)
        }
    },

}
module.exports = userController