const User = require('../models/user.model')
const bcryptjs = require('bcryptjs')
const loggerEvent = require('../utils/logger')
const { log } = require('winston')
const logger = loggerEvent('user')
const cloudinary = require('../.config/cloudinary')
const uploadToCloudinary = require('../utils/uploadToCloudinary')
const AppError = require('../utils/AppError');
const constantMessages = require('../utils/constants')

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const userController = {
    addUser: async (req, res, next) => {
        let uploadedPublicId = null
        try {
            const userFields = ["userName", "email", "address", "phone", "role", "isVerified", "password"]

            const existingUser = await User.findOne({ email: req.body.email })
            if (existingUser) {
                return next(new AppError(constantMessages.USER_ALREADY_EXISTS, 400))
            }
            const userData = {}
            userFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    userData[field] = req.body[field]
                }
            })
            if (req.file) {
                const result = await uploadToCloudinary(req.file.buffer, 'avatars')

                uploadedPublicId = result.public_id
                userData.avatar = {
                    url: result.secure_url,
                    publicId: result.public_id
                }
            }
            const user = await User.create(userData);
            res.status(201).json({
                success: true,
                message: "User created successfully",
                data: user
            })
        } catch (err) {
            if (uploadedPublicId) {
                try {
                    await cloudinary.uploader.destroy(uploadedPublicId)
                } catch (cleanUpErr) {
                    logger.error(cleanUpErr.message)
                }
            }
            logger.error(err.message)
            next(err)
        }
    },

    getAllUsers: async (req, res, next) => {
        try {
            const page = Math.max(parseInt(req.query.page) || 1, 1)
            const limit = Math.min(Math.max(parseInt(req.query.limit) || 5, 1), 100) // default 5 user max 100
            const skip = (page - 1) * limit
            const { search, role, isVerified } = req.query
            const filter = {}
            if (role) {
                filter.role = role
            }
            if (isVerified) {
                filter.isVerified = isVerified
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
                    .select('-password -tokens -resetPasswordToken -resetPasswordExpires')
                    .sort({ _id: -1 })
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
            next(err)
        }
    },

    getUser: async (req, res, next) => {
        try {
            const user = await User.findById(req.params.id)
            if (!user) {
                return next(new AppError(constantMessages.USER_NOT_FOUND, 404))
            }
            res.status(200).json({ success: true, data: user })
        } catch (err) {
            logger.error(err.message)
            next(err)
        }
    },

    updateUser: async (req, res, next) => {
        let newUploadPublicId = null
        try {
            if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
                return next(new AppError(constantMessages.USER_NOT_AUTHORIZED, 403))
            }

            const allowedFields = ["userName", "phone", "address", "email"]

            if (req.user.role == 'admin') {
                allowedFields.push('isVerified')
            }

            const updates = {}
            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updates[field] = req.body[field]
                }
            })

            if (req.user.role === 'admin' && req.body.email) {
                const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
                if (emailExists) {
                    return next(new AppError(constantMessages.USER_ALREADY_EXISTS, 400));
                }
            }
            let existingAvatarPublicId = null
            if (req.file) {
                const existingUser = await User.findById(req.params.id).select('avatar')

                existingAvatarPublicId = existingUser?.avatar?.publicId || null

                const result = await uploadToCloudinary(req.file.buffer, 'avatars')

                newUploadPublicId = result.public_id
                updates.avatar = {
                    url: result.secure_url,
                    publicId: result.public_id
                }



            }
            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ message: "No valid fields provided to update" })
            }

            const user = await User.findByIdAndUpdate(req.params.id, updates, {
                new: true,
                runValidators: true
            }).select('-password -tokens -resetPasswordToken -resetPasswordExpires')

            if (!user) { return next(new AppError(constantMessages.USER_NOT_FOUND, 404)) }

            if (existingAvatarPublicId) {
                await cloudinary.uploader.destroy(existingAvatarPublicId)
            }

            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: user
            })
        } catch (err) {
            if (newUploadPublicId) {
                try {
                    await cloudinary.uploader.destroy(newUploadPublicId)
                } catch (cleanUpErr) {
                    logger.error(cleanUpErr.message)
                }
            }
            logger.error(err.message)
            next(err)
        }
    },

    changeUserPassword: async (req, res, next) => {
        try {
            const { oldPassword, newPassword } = req.body;
            if (oldPassword === newPassword) {
                return next(new AppError(constantMessages.SAME_PASSWORD, 400));
            }
            const user = await User.findById(req.user.id).select('+password')
            if (!user) {
                return next(new AppError(constantMessages.INVALID_CREDENTIALS, 400))
            }

            const isMatch = await user.compareUserPass(oldPassword)
            if (!isMatch) {
                return next(new AppError(constantMessages.INCORRECT_OLD_PASSWORD, 400))
            }
            user.password = newPassword
            await user.save()

            res.status(200).json({
                success: true,
                message: constantMessages.PASSWORD_UPDATED
            })
        } catch (err) {
            logger.error(err.message)
            next(err)
        }
    },

    deleteUser: async (req, res, next) => {
        try {
            if (req.user.id === req.params.id) {
                return next(new AppError(constantMessages.USER_CANNOT_DELETE_SELF, 400));
            }
            const user = await User.findById(req.params.id);
            if (!user) { return next(new AppError(constantMessages.USER_NOT_FOUND, 404)) }

            user.isActive = false
            await user.save();

            res.status(200).json({
                success: true,
                data: {}
            })
        } catch (err) {
            logger.error(err.message)
            next(err)
        }
    }
}
module.exports = userController