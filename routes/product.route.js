const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const validate = require('../middleware/validate.middleware')
const { authentication, adminAuthorization } = require('../middleware/auth.middleware')
const imageUpload = require('../middleware/uploads.middleware')
const { createProductSchema, updateProductSchema } = require('../validation/products.validation')

// @ GET

router.get('/', authentication, productController.getProducts)
router.get('/search', authentication, productController.getProducts)
router.get('/id', authentication, productController.getProduct)

/* ----------------------------------- */
// @ POST
router.post('/', adminAuthorization, imageUpload.array('images', 5), validate(createProductSchema), productController.createProduct)

/* ----------------------------------- */
// @ PATCH
 router.patch('/id', adminAuthorization, imageUpload.array('images', 5),validate(updateProductSchema)
 ,productController.updateProduct)
/* ----------------------------------- */
router.delete('/id', adminAuthorization, productController.deleteProduct)
module.exports = router