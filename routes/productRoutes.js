import {Router} from 'express';
import  {createProduct, listProducts, getProduct,updateProduct}from '../controllers/productController.js';
import  validate from '../middlewares/validate.js';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import  requireAdmin  from '../middlewares/requireAdmin.js';
import {createProductSchema, updateProductSchema } from '../validations/productValidation.js';
const router = Router();

router.post('/',authMiddleware, requireAdmin, validate(createProductSchema), createProduct);
router.get('/', listProducts);
router.get('/:productId', getProduct);
router.put('/:productId', authMiddleware, requireAdmin,validate(updateProductSchema), updateProduct);

export  default router;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    