import {Router} from 'express';
import  { createCustomer, getCustomer, listCustomers, updateCustomer } from '../controllers/customerController.js';
import  {getCustomerCarts} from '../controllers/cartController.js';
import  {getCustomerOrders} from '../controllers/checkoutController.js';
import  {authMiddleware} from '../middlewares/authMiddleware.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import  validate from '../middlewares/validate.js';
import  {createCustomerSchema, updateCustomerSchema } from '../validations/customerValidation.js';
const router = Router();
router.post('/',validate(createCustomerSchema), createCustomer);
router.get('/',authMiddleware, requireAdmin,listCustomers);
router.get('/:customerId',authMiddleware,getCustomer);
router.put('/:customerId',authMiddleware,validate(updateCustomerSchema),updateCustomer);
//Cart Management related end point
router.get('/:customerId/carts', authMiddleware, getCustomerCarts);
//Checkout related  Endpoint
router.get('/:customerId/orders', authMiddleware,getCustomerOrders);

export default router;
