import {Router} from 'express';
import{createCart, getCart, addItem, updateItemQuantity, removeItem} from '../controllers/cartController.js';
import  {applyCoupon, removeCoupon } from '../controllers/couponController.js';
import  {checkout} from '../controllers/checkoutController.js';    
import  validate from '../middlewares/validate.js';
import {authMiddleware} from '../middlewares/authMiddleware.js';
import  {createCartSchema, addItemSchema, updateItemSchema } from '../validations/cartValidation.js';
import  {applyCouponSchema } from '../validations/couponValidation.js';
const router = Router();
router.post('/',authMiddleware,validate(createCartSchema), createCart);
router.get('/:cartId',authMiddleware,getCart);
router.post('/:cartId/items',authMiddleware,validate(addItemSchema), addItem);
router.put('/:cartId/items/:itemId',authMiddleware,validate(updateItemSchema), updateItemQuantity);
router.delete('/:cartId/items/:itemId',authMiddleware,removeItem);

//coupon related End points
router.post('/:cartId/coupon',  authMiddleware,validate(applyCouponSchema), applyCoupon);
router.delete('/:cartId/coupon',  authMiddleware,removeCoupon);

//Checkout related Endpoint
router.post('/:cartId/checkout',authMiddleware,checkout);
export default  router;
