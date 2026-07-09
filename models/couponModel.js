import {getDB } from '../config/db.js';

const COLLECTION = 'coupons';

async function createCoupon(data) {
  const db = getDB();
  const coupon = {
    couponCode: data.couponCode.toUpperCase(),
    discountPercentage: data.discountPercentage,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt:new Date(),
    updatedAt:new Date()
  };
  await db.collection(COLLECTION).insertOne(coupon);
  return coupon;
}

async function findCouponByCode(couponCode) {
  const db = getDB();
  return db.collection(COLLECTION).findOne({couponCode:couponCode.toUpperCase() });
}

export {createCoupon,findCouponByCode};
