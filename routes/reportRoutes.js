import {Router} from 'express';
import {cartSummary,productActivityReport,couponUsageReport,checkoutReport} from '../controllers/reportController.js';
import  {authMiddleware} from '../middlewares/authMiddleware.js';
import  requireAdmin from '../middlewares/requireAdmin.js';
const router = Router();

router.get('/carts/report',  authMiddleware,requireAdmin,cartSummary);
router.get('/products/cart-report',authMiddleware,requireAdmin,productActivityReport);
router.get('/coupons/report',authMiddleware,requireAdmin,couponUsageReport);
router.get('/checkouts/report',authMiddleware, requireAdmin,checkoutReport);

export default router;
