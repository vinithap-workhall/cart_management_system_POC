import {ObjectId } from 'mongodb';
import { getDB} from '../config/db.js';

const COLLECTION = 'orders';

async function createOrder(data) {
  const db = getDB();
  const newId = new ObjectId();
  const order = {
   _id: newId,
    orderId: newId.toString(),
    cartId: new ObjectId(data.cartId),
    customerId: new ObjectId(data.customerId),
    items: data.items,
    totalAmount: data.totalAmount,
    status: 'PLACED',
    createdAt: new Date()
  };
  await db.collection(COLLECTION).insertOne(order);
  return order;
}

async function findOrderById(orderId) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(orderId)});
}

async function findOrdersByCustomerId(customerId, page , limit) {
  const db = getDB();
  const skip = (page - 1) * limit;

  return db.collection(COLLECTION)
    .find({customerId:new ObjectId(customerId)}).sort({ createdAt: -1 })
    .skip(skip).limit(limit)
    .toArray();
}

export {createOrder,findOrderById, findOrdersByCustomerId };
