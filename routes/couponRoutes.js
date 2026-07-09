import {Router} from 'express';

import {createCoupon,getCoupon} from '../controllers/couponController.js';
import  validate from '../middlewares/validate.js';
import  {authMiddleware} from '../middlewares/authMiddleware.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import  {createCouponSchema} from '../validations/couponValidation.js';
const  router =Router();
router.post('/',authMiddleware,requireAdmin,validate(createCouponSchema), createCoupon);
router.get('/:couponCode',authMiddleware, getCoupon);

export default router;
