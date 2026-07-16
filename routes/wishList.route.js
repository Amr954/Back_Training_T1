const express = require('express')
const router = express.Router()
const wishListController = require('../controllers/wishList.controller')
const validate = require('../middleware/validate.middleware')
const { authentication } = require('../middleware/auth.middleware')

router.use(authentication)
// @ GET
router.get('/my',wishListController.getWishLists)

//@ POST
router.post('/add/:productId',wishListController.addToWishList)

//@ DELETE
router.delete('/remove/:productId',wishListController.removeFromWishList)
router.delete('/clear',wishListController.clearWishList)


module.exports = router