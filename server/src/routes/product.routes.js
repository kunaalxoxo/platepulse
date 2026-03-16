const router = require('express').Router();
const { createProduct, getProducts, getProductById, getMyProducts, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { verifyToken, requireRole } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

router.get('/my-products', verifyToken, requireRole('retail'), getMyProducts);

router.route('/')
  .get(getProducts) // Public
  .post(verifyToken, requireRole('retail'), uploadSingle('image', 'products'), createProduct);

router.route('/:id')
  .get(getProductById) // Public
  .patch(verifyToken, requireRole('retail'), updateProduct)
  .delete(verifyToken, requireRole('retail', 'admin'), deleteProduct);

module.exports = router;
