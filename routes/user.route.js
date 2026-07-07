const express = require('express')
const userController = require('../controllers/user.controller')
const validate = require('../middleware/validate.middleware')
const { adminAuthorization, authentication } = require('../middleware/auth.middleware')
const { changePasswordSchema } = require('../validation/auth.Validation')
const imageUpload = require('../middleware/uploads.middleware')

const router = express.Router()

router.post('/upload-avatar', authentication, imageUpload.single('avatar'), userController.uploadAvatar)
router.post('/add',adminAuthorization,userController.addUser)
router.post('/change-password',authentication,validate(changePasswordSchema),userController.changeUserPassword)
router.get('/all',adminAuthorization,userController.getAllUsers)
router.get('/:id',adminAuthorization,userController.getUser)
router.patch('/:id',authentication,userController.updateUser)
router.delete('/:id',adminAuthorization,userController.deleteUser)

module.exports = router