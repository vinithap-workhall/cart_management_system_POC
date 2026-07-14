import {getDB} from '../config/db.js';

const COLLECTION = 'couponUsageLogs';
async function logCouponUsage(couponCode, cartId, discountAmount) {
  const db = getDB();

  if (discountAmount === 0) {
    await db.collection(COLLECTION).deleteOne({cartId});
    return;
  }

  await db.collection(COLLECTION).updateOne(
    {cartId},
    {$set: {
        couponCode,
        discountAmount,
        updatedAt: new Date()
      },
      $setOnInsert: {
        createdAt: new Date()
      }
    },
    { upsert: true }
  );
}
export {logCouponUsage};
