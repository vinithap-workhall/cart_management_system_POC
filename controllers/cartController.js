import * as cartModel from'../models/cartModel.js';
import * as  productModel from '../models/productModel.js';
import * as  customerModel from'../models/customerModel.js';
import  {logProductActivity} from '../models/productActivityLogModel.js';
import {getDB } from "../config/db.js";
function canAccessCart(cart, user) {
  return cart.customerId === user.customerId && user.role !== 'admin';
}

export const createCart = async (req,res,next) => {
  try {
    const{role}= req.user;
    const {customerId} = req.user;
    if (role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin cannot create cart' });
    }
    const customer = await customerModel.findCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    const cart = await cartModel.createCart(customerId);
    return res.status(201).json({
      success: true,
      message: 'Cart created successfully',
      data: cart
    });
  } catch (err) {
    next(err);
  }
};

export const getCart = async (req,res,next) => {
  try {
    const cart = await cartModel.findCartById(req.params.cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    if (!canAccessCart(cart, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this cart' });
    }
    await cartModel.refreshPrice(cart);
    return res.status(200).json({
      success: true,
      message: 'Cart fetched successfully',
      data: cart
    });
  } catch (err) {
     next(err);
  }
};

export const  getCustomerCarts = async (req,res,next) => {
  try {
    const customer = await customerModel.findCustomerById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    if (req.params.customerId !== req.user.customerId) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource' });
    }

  const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
  const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;

    const carts = await cartModel.findCartsByCustomerId(req.params.customerId,page,limit);
    for (const cart of carts) {
      await cartModel.refreshPrice(cart);
    }
    return res.status(200).json({
      success: true,
      message: 'Carts fetched successfully',
      data: carts
    });
  } catch (err) {
      next(err);
  }
};

export const addItem = async (req,res,next) => {
  try {
    const {cartId} = req.params;
    const {productId,quantity} = req.body;

    const cart = await cartModel.findCartById(cartId);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    if (!canAccessCart(cart, req.user)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this cart' });
    }
    if (cart.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Cannot modify a checked-out cart' });
    }

    const product = await productModel.findProductById(productId);
    if (!product) {
      return res.status(404).json({success: false, message: 'Product not found' });
    }

    const existingItem =cart.items.find((item) => item.productId === productId);
    const requestedTotalQty = existingItem ? existingItem.quantity + quantity : quantity;
    
    if (!existingItem && cart.items.length >= 50) {
      return res.status(400).json({
        success: false,
        message: 'A cart can contain a maximum of 50 different products.'
      });
    }
    if (requestedTotalQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock} unit available`
      });
    }
    let statusCode;

    if (existingItem) {
      existingItem.quantity = requestedTotalQty;
      existingItem.totalPrice = existingItem.quantity * existingItem.unitPrice;
      statusCode = 200;
    } else {
      cart.items.push(cartModel.buildCartItem(product, quantity));
      statusCode = 201;
    }
    await cartModel.recalcAndSave(cart);
    await logProductActivity(productId, 'ADD', quantity);
    return res.status(statusCode).json({
      success: true,
      message: statusCode === 201 ? 'Item added to cart' : 'Item quantity updated',
      data: cart
    });
  } catch (err) {
     next(err);
  }
};

export const updateItemQuantity = async (req,res,next) => {
  try {
    const {cartId,itemId} = req.params;
    const {productId,quantity} = req.body;

    const cart = await cartModel.findCartById(cartId);
    if (!cart) {
      return res.status(404).json({success: false, message: 'Cart not found' });
    }
    if (!canAccessCart(cart, req.user)) {
      return res.status(403).json({success: false, message: 'You do not have access to this cart' });
    }
    if (cart.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Cannot modify a checked-out cart' });
    }

    const item =cart.items.find((i) => i.itemId === itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }
    if(item.productId!= productId){
      return res.status(400).json({sucess:false,message:'Cannot modify quantity of different item'})
    }

    const product = await productModel.findProductById(productId);
    if (!product) {
      return res.status(404).json({success: false, message: 'Product not found' });
    }
    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.stock} unit(s) available`
      });
    }
    if(item.quantity > quantity){
      await logProductActivity(item.productId,'REMOVE',item.quantity - quantity);
    }
    if(quantity > item.quantity){
      await logProductActivity(item.productId,'ADD', quantity - item.quantity);
    }
    item.quantity = quantity;
    item.unitPrice= product.price;
    item.totalPrice = item.unitPrice * quantity;
    
    await cartModel.recalcAndSave(cart);

    return res.status(200).json({
      success: true,
      message: 'Item quantity updated',
      data:cart 
    });
  } catch (err) {
    next(err);
  }
};


export const removeItem = async (req, res, next) => {
  try {
    const { cartId, itemId } = req.params;
    const cart = await cartModel.findCartById(cartId);
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    if (!canAccessCart(cart, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this cart",
      });
    }
    if (cart.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: "Cannot modify a checked-out cart",
      });
    }
    const item = cart.items.find((i) => i.itemId === itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }
    await cartModel.deleteItem(cartId,itemId)
    const updatedCart = await cartModel.findCartById(cartId);
    if (updatedCart.items.length === 0) {
      updatedCart.couponCode = null;
      updatedCart.discountPercentage = 0;
    }
    await cartModel.recalcAndSave(updatedCart);
    await logProductActivity(item.productId,"REMOVE",item.quantity
    );

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: updatedCart,
    });

  } catch (err) {
    next(err);
  }
};