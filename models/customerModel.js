import {ObjectId} from 'mongodb';
import {getDB} from'../config/db.js';

const COLLECTION = 'customers';

async function createCustomer(data) {
  const db = getDB();
  const newId = new ObjectId();
  const customer = {
    _id:newId,
    customerId: newId.toString(),
    name:data.name,
    email:data.email.toLowerCase(),
    phone:data.phone,
    address:data.address,
    password:data.password,
    role:'customer',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  await db.collection(COLLECTION).insertOne(customer);
  return findCustomerById(customer.customerId);
}

async function findCustomerById(customerId) {
  const db=getDB();
  return db.collection(COLLECTION).findOne({_id: new ObjectId(customerId) },{
     projection: { password: 0 } });
}

async function findCustomerByEmail(email) {
  const db=getDB();
return db.collection(COLLECTION).findOne({email:email.toLowerCase() });
}

async function listCustomers(filter, sort, { skip, limit }) {
  const db = getDB();
  return db.collection('customers')
    .find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .project({ password: 0 })  
    .toArray();
}

async function updateCustomer(customerId, data) {
  const db = getDB();
  const updateData = {
    name: data.name,
    phone: data.phone,
    address:data.address,
    updatedAt: new Date()
  };
  await db.collection(COLLECTION).updateOne({ _id:new ObjectId(customerId) }, { $set: updateData });
  return findCustomerById(customerId);
}

export {createCustomer,findCustomerById,
  findCustomerByEmail,listCustomers,updateCustomer};
