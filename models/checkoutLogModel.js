import {getDB } from '../config/db.js';

const COLLECTION = 'checkoutLogs';

async function logCheckoutAttempt(cartId, success, reason) {
  const db = getDB();
  await db.collection(COLLECTION).insertOne({
    cartId,
    success,
    reason,
    createdAt: new Date()
  });
}

export {logCheckoutAttempt};
