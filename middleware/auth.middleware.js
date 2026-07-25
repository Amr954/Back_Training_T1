const User = require("../models/user.model")
const AppError = require("../utils/AppError")
const constantMessages = require("../utils/constants")
const loggerEvent = require('../utils/logger')
const logger = loggerEvent('auth')
const jwt = require('jsonwebtoken')

const authentication = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization

        const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null
        if (!token) {
            return next(new AppError(constantMessages.NOT_AUTHORIZED, 401));
        }
        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        let valid
        try {
            valid = jwt.verify(token, secretKey) 

            req.user = await User.findById(valid.id).select("-password -tokens")
            if (!req.user) {
                return next(new AppError(MESSAGES.USER_DELETED_TOKEN, 401));
            }
            // Check if user is deactivated
            if (req.user.isActive === false) {
                return next(new AppError(constantMessages.ACCOUNT_DEACTIVATED, 403));
            }

            // Check if user is verified
            if (!req.user.isVerified) {
                return next(new AppError(constantMessages.EMAIL_NOT_VERIFIED, 403));
            }
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).send({
                    message: "access token expired",
                    code: "TOKEN_EXPIRED" // frontend can check this and call /refresh
                })
            }
            return next(new AppError(constantMessages.NOT_AUTHORIZED, 401));
        }

        next()

    } catch (err) {
        logger.error(err.message)
        res.status(401).send({ message: err.message })
    }
}

const adminAuthorization = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError(constantMessages.NOT_AUTHORIZED_ROLE, 403));
        }
        next();
    };
}

module.exports = {
    authentication,
    adminAuthorization
}