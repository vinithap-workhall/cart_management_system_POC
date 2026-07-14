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

async function findOrdersByCustomerId(filter, sort,skip, limit) {
  const db = getDB();
 return db.collection('carts')
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .toArray();
}

export {createOrder,findOrderById, findOrdersByCustomerId };
