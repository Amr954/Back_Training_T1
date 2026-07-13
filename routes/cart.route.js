const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cart.controller')
const { authentication } = require('../middleware/auth.middleware')

router.use(authentication)
// @ GET
router.get('/',cartController.getCarts)


module.exports = router