import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const COLLECTION = "carts";
const FIXED_TAX = 0.05;

function buildCartItem(product, quantity) {
  return {
    itemId: new ObjectId().toString(),
    productId: product.productId,
    quantity,
    unitPrice: product.price,
    totalPrice: product.price * quantity,
  };
}

function subtotalStage() {
  return { $set: { subtotal: { $round: [{ $sum: "$items.totalPrice" }, 2] } } };
}
function discountTaxTotalStages() {
  return [
    {
      $set: {
        discount: {
          $round: [
            {
              $cond: [
                { $gt: ["$discountPercentage", 0] },
                {
                  $multiply: [
                    "$subtotal",
                    { $divide: ["$discountPercentage", 100] },
                  ],
                },
                0,
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $set: {
        tax: {
          $round: [
            {
              $cond: [
                {
                  $gt: [{ $subtract: ["$subtotal", "$discount"] }, 0],
                },
                {
                  $multiply: [
                    { $subtract: ["$subtotal", "$discount"] },
                    FIXED_TAX,
                  ],
                },
                0,
              ],
            },
            2,
          ],
        },
      },
    },
    {
      $set: {
        total: {
          $round: [
            { $add: [{ $subtract: ["$subtotal", "$discount"] }, "$tax"] },
            2,
          ],
        },
      },
    },
    { $set: { updatedAt: "$$NOW" } },
  ];
}

async function createCart(customerId) {
  const db = getDB();
  const newId = new ObjectId();

  const cart = {
    _id: newId,
    cartId: newId.toString(),
    customerId,
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
  return db.collection(COLLECTION).findOne({ cartId });
}

async function findCartsByCustomerId(filter, sort,  skip, limit ) {
  const db = getDB();
  return db
    .collection(COLLECTION)
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();
}

async function addNewItem(cartId, product, quantity) {
  const db = getDB();
  const newItem = buildCartItem(product, quantity);

  await db
    .collection(COLLECTION)
    .updateOne({ cartId }, [
      { $set: { items: { $concatArrays: ["$items", [newItem]] } } },
      subtotalStage(),
      ...discountTaxTotalStages(),
    ]);
  return findCartById(cartId);
}

async function updateExistingItem(cartId, productId, quantity, price) {
  const db = getDB();
  await db.collection(COLLECTION).updateOne({ cartId }, [
    {
      $set: {
        items: {
          $map: {
            input: "$items",
            as: "item",
            in: {
              $cond: [
                { $eq: ["$$item.productId", productId] },
                {
                  $mergeObjects: [
                    "$$item",
                    {
                      quantity,
                      unitPrice: price,
                      totalPrice: { $multiply: [price, quantity] },
                    },
                  ],
                },
                "$$item",
              ],
            },
          },
        },
      },
    },
    subtotalStage(),
    ...discountTaxTotalStages(),
  ]);

  return findCartById(cartId);
}

async function deleteItem(cartId, itemId) {
  const db = getDB();
  await db.collection(COLLECTION).updateOne({ cartId }, [
    {
      $set: {
        items: {
          $filter: {
            input: "$items",
            as: "item",
            cond: { $ne: ["$$item.itemId", itemId] },
          },
        },
      },
    },
    subtotalStage(),
    {
      $set: {
        couponCode: {
          $cond: [{ $lte: ["$subtotal", 0] }, null, "$couponCode"],
        },
        discountPercentage: {
          $cond: [{ $lte: ["$subtotal", 0] }, 0, "$discountPercentage"],
        },
      },
    },
    ...discountTaxTotalStages(),
  ]);

  return findCartById(cartId);
}

async function recalculateTotals(cartId) {
  const db = getDB();

  await db
    .collection(COLLECTION)
    .updateOne({ cartId }, [subtotalStage(), ...discountTaxTotalStages()]);

  return findCartById(cartId);
}

async function refreshPrice(cart) {
  if (cart.status === "CHECKED_OUT") {
    return { cart, priceChanges: [] };
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
    if (!product) continue;
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
    await db
      .collection(COLLECTION)
      .updateOne(
        { cartId: cart.cartId },
        { $set: { items: cart.items, updatedAt: new Date() } },
      );
    cart = await recalculateTotals(cart.cartId);
  }
  return { cart, priceChanges };
}

async function couponRecal(cartId, couponCode, discountPercentage) {
  const db = getDB();
  await db
    .collection(COLLECTION)
    .updateOne({ cartId }, [
      { $set: { couponCode, discountPercentage } },
      subtotalStage(),
      ...discountTaxTotalStages(),
    ]);

  return findCartById(cartId);
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
  buildCartItem,
};
