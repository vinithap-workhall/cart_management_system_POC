import * as cartModel from '../models/cartModel.js';
import * as orderModel from '../models/orderModel.js';
import * as productModel from '../models/productModel.js';
import * as customerModel from '../models/customerModel.js';
import  {logCheckoutAttempt} from '../models/checkoutLogModel.js';
import { buildFilter, buildSort, buildPagination } from '../utils/built.js';

const ORDER_FILTER_SCHEMA = {
  minTotal: { field: 'totalAmount', type: 'gte' },
  maxTotal: { field: 'totalAmount', type: 'lte' },
  couponCode: { field: 'couponCode', type: 'exact' },
  startDate: { field: 'createdAt', type: 'dateGte' },
  endDate: { field: 'createdAt', type: 'dateLte' },
};
const ORDER_SORTABLE_FIELDS = ['createdAt', 'total'];

export const checkout = async (req,res,next) => {
  const {cartId} = req.params;
  try {
    const cart = await cartModel.findCartById(cartId);
    if (!cart) {
      await logCheckoutAttempt(cartId, false, 'Cart not found');
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    if (cart.customerId !== req.user.customerId ) {
      await logCheckoutAttempt(cartId, false, 'Cart does not belong to this customer');
      return res.status(403).json({ success: false, message: 'You do not have access to this cart' });
    }

    if (cart.status !== 'ACTIVE') {
      await logCheckoutAttempt(cartId, false, 'Cart already checked out');
      return res.status(400).json({ success: false, message: 'Cart is already checked out' });
    }

    if (!cart.items || cart.items.length === 0) {
      await logCheckoutAttempt(cartId, false, 'Empty cart');
      return res.status(400).json({ success: false, message: 'Cannot checkout an empty cart' });
    }
    await cartModel.refreshPrice(cart);
    
    const decrementedItems = [];
    for (const item of cart.items) {
      const decremented = await productModel.decrementStockIfAvailable(item.productId, item.quantity);

      if (!decremented) {
        for (const done of decrementedItems) {
          await productModel.incrementStock(done.productId, done.quantity);
        }

        const product = await productModel.findProductById(item.productId);
        await logCheckoutAttempt(cartId, false, `${product.name} is out of stock`);
        let message;
        if (product.stock === 0) {
          message = `${product.name} is out of stock.`;
        } else {
          message = `Only ${product.stock} ${product.name} item(s) are available.`;
        }
        if (message) {
          return res.status(400).json({
            success: false,
            message
          });
        }
      }

      decrementedItems.push(item);
    }
    
    const order = await orderModel.createOrder({
      cartId: cart.cartId,
      customerId: cart.customerId,
      items: cart.items,
      totalAmount: cart.total
    });

    cart.status = 'CHECKED_OUT';
    await cartModel.saveCart(cart);

    await logCheckoutAttempt(cartId, true, 'Checkout successful');

    return res.status(201).json({
      success: true,
      message: 'Checkout successful',
      data: order
    });
  } catch (err) {
     next(err);
  }
};

export const getOrder = async (req,res,next) => {
  try {
    const order = await orderModel.findOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
   if ( req.user.role !== "admin" && order.customerId.toString() !== req.user.customerId){
      return res.status(403).json({ success: false, message: 'You do not have access to this order' });
    }
    return res.status(200).json({
      success: true,
      message: 'Order fetched successfully',
      data: order
    });
  } catch (err) {
     next(err);
  }
};

export const getCustomerOrders = async (req,res,next) => {
  try {
    if (req.user.role !== 'admin' && req.params.customerId !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource' });
    }
    const customer = await customerModel.findCustomerById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const filter = buildFilter(req.query, ORDER_FILTER_SCHEMA);
    filter.customerId = req.params.customerId;
    const sort = buildSort(req.query, ORDER_SORTABLE_FIELDS);
    const { page, limit, skip } = buildPagination(req.query);

    const orders = await orderModel.findOrdersByCustomerId(filter, sort,skip,limit);
    return res.status(200).json({
      success: true,
      message: 'Orders fetched successfully',
      data: orders,
      pagination: { page, limit }
    });
  } catch (err) {
      next(err);
  }
};