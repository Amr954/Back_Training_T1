const express = require('express')
const userController = require('../controllers/user.controller')
const { adminAuthorization, authentication } = require('../middleware/auth.middleware')
const router = express.Router()

router.post('/add',adminAuthorization,userController.addUser)
router.get('/all',adminAuthorization,userController.getAllUsers)
router.get('/:id',adminAuthorization,userController.getUser)
router.patch('/:id',authentication,userController.updateUser)
router.delete('/:id',adminAuthorization,userController.deleteUser)

module.exports = router