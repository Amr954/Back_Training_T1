const express = require('express')
const router = express.Router()
const adminController = require('../controllers/admin.controller')
const { adminAuthorization } = require('../middleware/auth.middleware')

router.use(adminAuthorization)

//@GET
router.get('/dashboard',adminController.adminDashboardStats)


module.exports = router