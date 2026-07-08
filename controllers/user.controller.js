const User = require('../models/user.model')
const loggerEvent = require('../services/logger.service')
const { log } = require('winston')
const logger = loggerEvent('user')
const cloudinary = require('../.config/cloudinary')
const uploadToCloudinary = require('../utils/uploadToCloudinary')

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const userController = {
    addUser: async (req, res) => {
        try {
            const userFields = ["userName", "email", "address", "phone", "role", "isVerified"]

            const userData = {}
            userFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    userData[field] = req.body[field]
                }
            })
            const user = await User.create(userData);
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
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100) // default 20 user max 100
            const skip = (page - 1) * limit
            const { search, role } = req.query
            const filter = {}
            if (role) {
                filter.role = role
            }
            if (search) {
                const safeSearch = escapeRegex(search)
                const regex = new RegExp(safeSearch, 'i')
                filter.$or = [
                    { userName: regex },
                    { email: regex }
                ]
            }
            const [users, totalItems] = await Promise.all([
                User.find(filter)
                    .select('-password -tokens -resetPasswordToken -resetPasswordExpires') // hide sensitive fields')
                    .sort({ _id: -1 }) // newest users first
                    .skip(skip)
                    .limit(limit),
                User.countDocuments(filter)
            ]);
            res.status(200).json({
                success: true,
                message: `count of users ${users.length}`,
                data: users,
                pagination: {
                    page,
                    limit,
                    totalItems,
                    totalPages: Math.ceil(totalItems / limit)
                }
            });


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

            const allowedFields = ["userName", "Phone", "Address", "email"]

            if (req.user.role == 'admin') {
                allowedFields.push('isVerified')
            }

            const updates = {}
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field]
                }
            })

            if (req.file) {
                const existingUser = await User.findById(req.params.id).select('avatar')

                if (existingUser?.avatar?.publicId) {
                    await cloudinary.uploader.destroy(existingUser.avatar.publicId)
                }

                const result = await uploadToCloudinary(req.file.buffer, 'avatars')
                updates.avatar = {
                    url: result.secure_url,
                    publicId: result.public_id
                }
            }

            const user = await User.findByIdAndUpdate(req.params.id, updates, {
                new: true,
                runValidators: true
            }).select('-password -tokens -resetPasswordToken -resetPasswordExpires')

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

    changeUserPassword: async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const user = await User.findById(req.user.id).select('password')
            if (!user) {
                return res.status(404).json({ message: "Invalid credentials" })
            }
            const isMatch = await user.compareUserPass(oldPassword)
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            user.password = newPassword
            await user.save()
            res.status(200).json({
                success: true,
                message: "Password updated!"
            })
        } catch (err) {
            logger.error(err.message)
            res.status(400).send({
                message: err.message
            })
        }
    },


    changeUserRole: async (req, res) => {
        try {
            const { role } = req.body
            if (req.user.role === req.params.role) {
                return res.status(400).json({ message: "You cannot change your own role" })
            }
            const user = await User.findByIdAndUpdate(req.params.id,
                { role },
                { new: true, runValidators: true }
            ).select('-password -tokens -resetPasswordToken -resetPasswordExpires')
            if (!user) {
                { return res.status(404).json({ message: "user not found." }) }
            }
            res.status(200).json({
                success: true,
                message: `Role updated to ${role} for user ${user.userName}`,
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
            const user = await User.findById(req.params.id);
            if (!user) { return res.status(404).json({ message: "user not found." }) }

            if (user.avatar?.publicId) {
                await cloudinary.uploader.destroy(user.avatar.publicId)
            }
            await User.findByIdAndDelete(req.params.id);
            res.json({
                message: "Account deleted successfully!",
                data: {}
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