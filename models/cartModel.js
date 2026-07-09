import {ObjectId} from 'mongodb';
import  {getDB} from '../config/db.js';
import {findProductById } from './productModel.js';
const COLLECTION = 'carts';
const FIXED_TAX = 0.05; 

function round(num) {
  return Math.round(num * 100) / 100;
}
function calculateCartTotals(cart) {
  const subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  let discount = 0;
  if (cart.discountPercentage > 0) {
    discount = (subtotal * cart.discountPercentage) / 100;
  }
  const taxableAmount = subtotal - discount;
  const tax = taxableAmount > 0 ? taxableAmount * FIXED_TAX : 0;
  const total = taxableAmount + tax;

  return {
    subtotal:round(subtotal),
    discount:round(discount),
    tax:round(tax),
    total: round(total)
  };
}
function couponRecal(cart){
  let discount = 0;
  if (cart.discountPercentage > 0) {
    discount = (cart.subtotal * cart.discountPercentage) / 100;
  }
  const taxableAmount = cart.subtotal - discount;
  const tax = taxableAmount > 0 ? taxableAmount * FIXED_TAX : 0;
  const total = taxableAmount + tax;
  console.log(discount);
  return {
    subtotal:round(cart.subtotal),
    discount:round(discount),
    tax:round(tax),
    total: round(total)
  };
}

async function recalcAndSave(cart) {
  const totals = calculateCartTotals(cart);
  Object.assign(cart, totals);
  await saveCart(cart);
  return cart;
}

async function refreshPrice(cart){
  if(cart.status === 'CHECKED_OUT'){
    return cart;
  }
  let change=false;
  for(const item of cart.items){
    const product = await findProductById(item.productId);
  if(item.unitPrice!== product.price){
         item.unitPrice = product.price;
         item.totalPrice= product.price* item.quantity;
         change= true;
  }
}
if(change){
  await recalcAndSave(cart);
}
return cart;
}

function buildCartItem(product, quantity) {
  return {
    itemId: new ObjectId().toString(),
    productId: product.productId,
    quantity,
    unitPrice: product.price,
    totalPrice: product.price * quantity
  };
}

async function createCart(customerId) {
  const db = getDB();
  const newId = new ObjectId();

  const cart = {
    _id: newId,
    cartId: newId.toString(),
    customerId: customerId,
    items: [], 
    couponCode: null,
    discountPercentage: 0,
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
    status: 'ACTIVE', 
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection(COLLECTION).insertOne(cart);
  return cart;
}

async function findCartById(cartId) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({_id: new ObjectId(cartId)});
}

async function findCartsByCustomerId(customerId, page, limit) {
  const db = getDB();
  const skip = (page - 1) * limit;
  return db.collection(COLLECTION).find({customerId})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

async function listAllCarts(page, limit) {
  const db = getDB();
  const skip = (page - 1) * limit; 
  return db.collection(COLLECTION)
    .find()
    .skip(skip)
    .limit(limit)
    .toArray();
}

async function deleteItem(cartId,itemId){
  const db= getDB();
  await db.collection("carts").updateOne(
      { _id: new ObjectId(cartId)},
      { $pull: {
          items: {
            itemId: itemId,
          },
        },
      }
    );
}
async function saveCart(cart) {
  const db = getDB();
  cart.updatedAt = new Date();
  await db.collection(COLLECTION).updateOne({ _id: new ObjectId(cart.cartId) }, { $set: cart });
  return cart;
}


export {createCart,findCartById,findCartsByCustomerId,listAllCarts,recalcAndSave,couponRecal
  ,deleteItem,refreshPrice,saveCart,calculateCartTotals,buildCartItem};