import {Router} from 'express';
import { getOrder } from '../controllers/checkoutController.js';
import  {authMiddleware} from '../middlewares/authMiddleware.js';
const router = Router();

//Checkout related endpoit
router.get('/:orderId',authMiddleware, getOrder);

export default router;
