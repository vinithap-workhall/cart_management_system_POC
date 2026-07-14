import {ObjectId} from 'mongodb';
import  {getDB} from '../config/db.js';
const COLLECTION = 'products';

async function createProduct(data) {
  const db = getDB();
  const product = {
    productId:data.productId,
    name:data.name,
    price:data.price,
    stock:data.stock,
  };
  await db.collection(COLLECTION).insertOne(product);
  return product;
}

async function findProductById(productId) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({productId});
}

async function listProducts(filter, sort, { skip, limit }) {
  const db = getDB();
  return db.collection('products')
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();
}
async function updateProduct(productId, data) {
  const db = getDB();

  await db.collection(COLLECTION).replaceOne(
    {productId },
    {productId,
      name:data.name,
      price:data.price,
      stock:data.stock
    }
  );

  return findProductById(productId);
}

async function decrementStockIfAvailable(productId, quantity) {
  const db=getDB();
  const result = await db.collection(COLLECTION).updateOne(
    {productId,stock:{ $gte: quantity } },
    {$inc:{stock:-quantity }}
  );
  return result.matchedCount === 1;
}
async function incrementStock(productId, quantity) {
  const db = getDB();
  await db.collection(COLLECTION).updateOne(
    { productId },
    { $inc: { stock: quantity },}
  );
}

export {createProduct,findProductById,listProducts,
  updateProduct,decrementStockIfAvailable,incrementStock
};
