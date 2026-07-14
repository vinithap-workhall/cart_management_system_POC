import {getDB} from '../config/db.js';

const COLLECTION = 'productActivityLogs';
async function logProductActivity(customerId,productId,action,quantity) {
  const db = getDB();

  await db.collection(COLLECTION).updateOne(
    { customerId,productId,action},
    { $inc:{quantity },  
      $set:{updatedAt: new Date() },
      $setOnInsert: {createdAt:new Date()}
    },
    { upsert:true}  
  );
}

export {logProductActivity};
