import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";
const COLLECTION = "carts";
const FIXED_TAX = 0.05;

function round(num) {
  return Math.round(num * 100) / 100;
}

function buildCartItem(product, quantity) {
  return {
    itemId: new ObjectId().toString(),
    productId: product.productId,
    quantity,
    unitPrice: product.price,
    totalPrice: product.price * quantity,
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
    status: "ACTIVE",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await db.collection(COLLECTION).insertOne(cart);
  return cart;
}

async function findCartById(cartId) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(cartId) });
}

async function findCartsByCustomerId(filter, sort, { skip, limit }) {
  const db = getDB();
  return db
    .collection(COLLECTION)
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();
}
async function deleteItem(cart, itemId,removeValue) {
  const db =getDB();
  cart.subtotal =round(cart.subtotal -removeValue);
  if(cart.subtotal<=0){
     cart.discountPercentage=0;
     cart.couponCode=null;
  }
  const totals= calculateCartTotals(cart);
  await db.collection(COLLECTION).updateOne(
    { _id:cart._id },
    {
      $pull: {
        items: {
          itemId: itemId,
        },
      },
      $set: {
        ...totals,
        discountPercentage:cart.discountPercentage,
        couponCode:cart.couponCode,
        updatedAt: new Date(),
      },
    },
  );
  return await findCartById(cart.cartId);
}
async function updateExistingItem(cart, productId, quantity, price, changeValue) {
  const db = getDB();
  cart.subtotal = round(cart.subtotal + changeValue);
  const totals=calculateCartTotals(cart);
  await db.collection(COLLECTION).updateOne(
    { cartId:cart.cartId,
      "items.productId": productId,
    },
    {
      $set: {
        "items.$.quantity": quantity,
        "items.$.unitPrice": price,
        "items.$.totalPrice": price * quantity,
         ...totals,
        updatedAt: new Date(),
      },
    }
  );

  return await findCartById(cart.cartId);
}

async function addNewItem(cart,product,quantity) {
  const db = getDB();
  cart.subtotal = round(cart.subtotal + (product.price * quantity));
  const totals = calculateCartTotals(cart);

  await db.collection(COLLECTION).updateOne(
    { cartId: cart.cartId },
    {
      $push: {
        items: buildCartItem(product, quantity),
      },
      $set: {
        ...totals,
        updatedAt: new Date(),
      },
    }
  );

  return await findCartById(cart.cartId);
}

async function refreshPrice(cart) {
  if (cart.status === "CHECKED_OUT") {
    return {
      cart,
      priceChanges: [],
    };
  }
  const db = getDB();
  const productIds = cart.items.map((item) => item.productId);
  const products = await db
    .collection("products")
    .find({ productId: { $in: productIds } })
    .toArray();
  const productMap = new Map(
    products.map((product) => [product.productId, product]),
  );

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
        newPrice: product.price,
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
          updatedAt: new Date(),
        },
      },
    );
    cart = await recalculateTotals(cart.cartId);
  }
  return {
    cart,
    priceChanges,
  };
}

async function recalculateTotals(cartId) {
  const db = getDB();
  const cart = await findCartById(cartId);
   cart.subtotal = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totals = calculateCartTotals(cart);  
  await db.collection(COLLECTION).updateOne(
    { cartId },
    {
      $set: {
        ...totals,
        updatedAt: new Date(),
      },
    },
  );
  return await findCartById(cartId);
}
function calculateCartTotals(cart) {
  let discount = 0;
  if (cart.discountPercentage > 0) {
    discount = (cart.subtotal * cart.discountPercentage) / 100;
  }
  const taxableAmount = cart.subtotal - discount;
  const tax = taxableAmount > 0 ? taxableAmount * FIXED_TAX : 0;
  const total = taxableAmount + tax;
  return {
    subtotal: round(cart.subtotal),
    discount: round(discount),
    tax: round(tax),
    total: round(total),
  };
}

async function couponRecal(cart) {
  const db = getDB();
  const totals= calculateCartTotals(cart);
  await db.collection(COLLECTION).updateOne(
    { cartId: cart.cartId },
    {$set: {
        couponCode: cart.couponCode,
        discountPercentage: cart.discountPercentage,
        ...totals,
        updatedAt: new Date(),
      },
    },
  );
  return await findCartById(cart.cartId);
}
export {
  recalculateTotals,
  addNewItem,
  updateExistingItem,
  createCart,
  findCartById,
  findCartsByCustomerId,
  couponRecal,
  deleteItem,
  refreshPrice,
  calculateCartTotals,
  buildCartItem,
};
