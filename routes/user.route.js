const express = require('express')
const userController = require('../controllers/user.controller')
const validate = require('../middleware/validate.middleware')
const { adminAuthorization, authentication } = require('../middleware/auth.middleware')
const { changePasswordSchema, updateUserSchema, addUserSchema} = require('../validation/auth.Validation')
const imageUpload = require('../middleware/uploads.middleware')

const router = express.Router()

router.post('/add',adminAuthorization,validate(addUserSchema),userController.addUser)
router.post('/change-password',authentication,validate(changePasswordSchema),userController.changeUserPassword)
router.get('/all',adminAuthorization,userController.getAllUsers)
router.get('/:id',adminAuthorization,userController.getUser)
router.patch('/:id',authentication,imageUpload.single('avatar'),validate(updateUserSchema),userController.updateUser)
router.delete('/:id',adminAuthorization,userController.deleteUser)

module.exports = router