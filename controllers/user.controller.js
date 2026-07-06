const User = require('../models/user.model')
const loggerEvent = require('../services/logger.service')
const { log } = require('winston')
const logger = loggerEvent('user')

const userController = {
    addUser: async (req, res) => {
        try {
            let userData = req.body
            let user = await User.create(userData);
            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user
            })
        } catch (err) {
            logger.error(err.message)
            res.status(400).send({
                message: err.message
            })
        }
    },

    getAllUsers: async (req, res) => {
        try {
            const users = await User.find();
            res.status(200).json({
                success: true,
                message: `count of users ${users.length}`,
                data: users
            })
        } catch (err) {
            logger.error(err.message)
            res.status(400).send({
                message: err.message
            })
        }
    },

    getUser: async (req, res) => {
        try {
            const user = await User.findById(req.params.id)
            if (!user) {
                return res.status(404).json({ message: "User not found" })
            }
            res.status(200).json({ success: true, data: user })
        } catch (err) {
            logger.error(err.message)
            res.status(400).send({
                message: err.message
            })
        }
    },

    updateUser: async (req, res) => {
        try {
            if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
                return res.status(403).json({ message: "You are not authorized to do this" })
            }
            if (req.body.password) { delete req.body.bassword };

            const user = await User.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            })
            if (!user) { return res.status(404).json({ message: "user not found." }) }
            res.status(200).json({
                success: true,
                data: user
            })
        } catch (err) {
            logger.error(err.message)
            res.status(400).send({
                message: err.message
            })
        }
    },

    deleteUser: async (req, res) => {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) { return res.status(404).json({ message: "user not found." }) }
            res.json({
                message: "Account deleted successfully!",
                data:{}
            })
        } catch (error) {
            logger.error(err.message)
            res.status(400).send({
                message: err.message
            })
        }
    }
}
module.exports = userController