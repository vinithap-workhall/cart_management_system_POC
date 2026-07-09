import * as  cartModel from '../models/cartModel.js';
import {getDB} from '../config/db.js';

export const cartSummary = async (req,res,next) => {
  try {
     const db = getDB();
     const total = await db.collection("carts").countDocuments();
    const partialActive = await db.collection("carts").countDocuments({
    status: "ACTIVE"
     });
    const checkedOut = await db.collection("carts").countDocuments({
    status: "CHECKED_OUT"
  });
    const abandonHrs = 24;
    const cutoff = new Date(Date.now() - abandonHrs * 60 * 60 * 1000);
    const abandoned = await db.collection("carts").countDocuments({
     status: "ACTIVE", updatedAt: {$lt: cutoff }});
    const active = partialActive - abandoned;
    return res.status(200).json({
      success:true,
      message:'Cart summary report',
      data: {
        totalCarts:total,
        activeCarts:active,
        checkedOutCarts:checkedOut,
        abandonedCarts:abandoned
      }
    });
  } catch (err) {
    next(err);
  }
};

export const productActivityReport = async (req, res, next) =>{
  try {
    const db = getDB();
    const productsAdded = await db.collection("productActivityLogs").find(
    { action: "ADD" },
    {projection: {
        _id: 0,
        productId: 1,
        quantity: 1
      }
    }
  ).sort({ quantity: -1 })
  .toArray();

  const productsRemoved = await db.collection("productActivityLogs")
  .find(
    { action: "REMOVE" },
    {
      projection: {
        _id: 0,
        productId: 1,
        quantity: 1
      }
    }
  )
  .sort({ quantity: -1 })
  .toArray();
  const mostPopularProducts =  productsAdded.slice(0, 10);

    return res.status(200).json({
      success: true,
      data: {
        productsAdded,
        productsRemoved,
        mostPopularProducts
      }
    });

  } catch (err) {
    next(err);
  }
};

export const couponUsageReport = async (req, res, next) => {
  try {
    const db = getDB();
    const report = await db.collection("couponUsageLogs").aggregate([
        {
          $group: {
            _id: null,
            totalUsageCount:{$sum: 1 },
            totalDiscountAmount: { $sum: "$discountAmount" }
          }
        }
      ])
      .next();

    return res.status(200).json({
      success: true,
      message: "Coupon usage report",
      data: {
        totalUsageCount: report?.totalUsageCount || 0,
        totalDiscountAmount: report?.totalDiscountAmount || 0
      }
    });

  } catch (err) {
    next(err);
  }
};

export const checkoutReport = async (req, res, next) => {
  try {
    const db = getDB();

    const report = await db.collection("checkoutLogs").aggregate([
      {
        $group: {
          _id: null,
          successfulCheckouts: {
            $sum: {
              $cond: ["$success", 1, 0]
            }
          },
          failedCheckouts: {
            $sum: {
              $cond: ["$success", 0, 1]}
          }
        }
      }
    ]).next();


    const successfulCheckouts = report?.successfulCheckouts || 0;
    const failedCheckouts = report?.failedCheckouts || 0;
    const cartCount = successfulCheckouts+ failedCheckouts;
    const conversionPercentage =cartCount > 0? Math.round((successfulCheckouts / cartCount) * 10000) / 100:0;

    return res.status(200).json({
      success: true,
      message: "Checkout report",
      data: {
        successfulCheckouts,
        failedCheckouts,
        conversionPercentage
      }
    });

  } catch (err) {
    next(err);
  }
};