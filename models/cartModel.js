import {ObjectId} from 'mongodb';
import  {getDB} from '../config/db.js';
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

async function refreshPrice(cart) {
  if (cart.status === "CHECKED_OUT") {
    return {
      cart,
      priceChanges: []
    };
  }
  const db = getDB();
  const productIds = cart.items.map(item => item.productId);
  const products = await db.collection("products").find(
    {productId: { $in: productIds }}).toArray();
  const productMap = new Map(
      products.map(product => [product.productId, product]));

  let changed = false;
  const priceChanges = [];

  for (const item of cart.items) {
    const product = productMap.get(item.productId);
    if (!product) {
    continue;
     }
    if (item.unitPrice !== product.price) {
        priceChanges.push({
            productName: product.name,
            oldPrice: item.unitPrice,
            newPrice: product.price
        });
        item.unitPrice = product.price;
        item.totalPrice = product.price * item.quantity;
        changed = true;
    }
}
if (changed) {
    await db.collection(COLLECTION).updateOne(
        { cartId: cart.cartId },
        {
            $set: {
                items: cart.items,
                updatedAt: new Date()
            }
        }
    );
    await recalculateTotals(cart.cartId);
    cart = await findCartById(cart.cartId);
}
  return {
    cart,
    priceChanges
  };
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

async function findCartsByCustomerId(filter, sort, {skip, limit}) {
  const db = getDB();
  return db.collection('carts')
    .find(filter)
    .sort(sort)
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
         $set: {
        updatedAt: new Date()
      }
      }
    );
}

async function updateExistingItem(cartId, productId, quantity, price) {
    const db = getDB();
    await db.collection(COLLECTION).updateOne(
        {cartId,"items.productId": productId},
        {$set: {
                "items.$.quantity": quantity,
                "items.$.unitPrice": price,
                "items.$.totalPrice": price * quantity,
                updatedAt: new Date()
            }
        }
    );
}
async function addNewItem(cartId, product, quantity) {
    const db = getDB();
    await db.collection(COLLECTION).updateOne(
        {cartId},
        {$push: {
            items: buildCartItem(product, quantity)
            },
            $set: {
                updatedAt: new Date()
            }
        }
    );
}

async function recalculateTotals(cartId) {
     const db = getDB();
     const cart= await findCartById(cartId);
    const totals = calculateCartTotals(cart);
    await db.collection(COLLECTION).updateOne(
        { cartId },
        {
            $set: {
                ...totals,
                updatedAt: new Date()
            }
        }
    );
    return await findCartById(cartId);
}
export {recalculateTotals,addNewItem,updateExistingItem,createCart,findCartById,findCartsByCustomerId,couponRecal
  ,deleteItem,refreshPrice,calculateCartTotals,buildCartItem};