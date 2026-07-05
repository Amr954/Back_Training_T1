const  User  = require("../models/user.model")
const loggerEvent = require('../services/logger.service')
const logger = loggerEvent('auth')
const jwt = require('jsonwebtoken')

const authentication = async (req, res, next) => {
    try {
        // console.log(req.cookies);
        const authHeader = req.headers.authorization

        const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null
        if (!token) {
            return res.status(401).send({ message: "unauthorized user" })
        }
        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        let valid
        try {
            valid = jwt.verify(token, secretKey) // sync, no await needed
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).send({
                    message: "access token expired",
                    code: "TOKEN_EXPIRED" // frontend can check this and call /refresh
                })
            }
            return res.status(401).send({ message: "unauthorized user" })
        }

        const user = await User.findById(valid.id).select("-password -tokens")
        if (!user) {
            return res.status(401).send({ message: "unauthorized user" })
        }

        req.user = user
        next()

    } catch (err) {
        logger.error(err.message)
        res.status(401).send({ message: err.message })
    }
}

const adminAuthorization = (req, res, next) => {
    authentication(req, res, () => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).send({ message: "unauthorized Admin" })
            }
            next()
        } catch (err) {
            logger.error(err.message)
            res.status(500).send({ message: err.message })
        }
    })
}

module.exports = {
    authentication,
    adminAuthorization
}