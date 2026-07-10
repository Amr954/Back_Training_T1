const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const validate = require('../middleware/validate.middleware')
const { authentication, adminAuthorization } = require('../middleware/auth.middleware')
const imageUpload = require('../middleware/uploads.middleware')
const { createProductSchema } = require('../validation/products.validation')

router.get('/', authentication, productController.getAllProducts)
router.get('/search', authentication, productController.searchProducts)
router.get('/id', authentication, productController.getProduct)
router.post('/', adminAuthorization, imageUpload.array('images',5),validate(createProductSchema),productController.createProduct)
router.get('/id', adminAuthorization, productController.deleteProduct)
module.exports = router