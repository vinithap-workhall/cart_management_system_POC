import {MongoClient} from 'mongodb';
let client;
let db;

async function createIndexes() {
  await db.collection('customers').createIndex({email: 1 }, { unique: true });
  await db.collection('products').createIndex({ productId: 1 }, {unique: true });
  await db.collection('coupons').createIndex({couponCode: 1}, {unique:true });
}
async function connectDB() {
  if(db)
    return db;
  const url = process.env.MONGODB_URI ;
  const dbName = process.env.DB_NAME ;
  client= new MongoClient(url);
  await client.connect();
  db = client.db(dbName);
  await createIndexes();
  console.log(`Connected to  ${dbName}`);
  return db; 
}
function getDB() {
  if (!db) {
    throw new Error('Unable to process your request at this time.');
  }
  return db;
}

export {connectDB,getDB};
