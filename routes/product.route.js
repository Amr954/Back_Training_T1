const express = require('express')
const router = express.Router()
const productController = require('../controllers/product.controller')
const validate = require('../middleware/validate.middleware')
const { authentication, adminAuthorization } = require('../middleware/auth.middleware')
const imageUpload = require('../middleware/uploads.middleware')
const { createProductSchema, updateProductSchema, addReviewSchema } = require('../validation/products.validation')

// @ GET

router.get('/', productController.getProducts)
router.get('/search', productController.getProducts)
router.get('/:id', productController.getProduct)
router.get('/:id/reviews', productController.getReviews)

/* ----------------------------------- */
// @ POST
router.post('/', adminAuthorization, imageUpload.array('images', 5),
    validate(createProductSchema), productController.createProduct)

router.post('/:id/reviews', authentication,validate(addReviewSchema) ,productController.addReview)
/* ----------------------------------- */
// @ PUT

router.put('/update/:id', adminAuthorization, imageUpload.array('images', 5), validate(updateProductSchema)
    , productController.updateProduct)

/* ----------------------------------- */
// @ DELETE
router.delete('/:id', adminAuthorization, productController.deleteProduct)
router.delete('/:id/reviews/:rid', adminAuthorization, productController.deleteReview)

module.exports = router