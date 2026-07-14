import * as  cartModel from '../models/cartModel.js';
import {getDB} from '../config/db.js';
import { buildFilter, buildPagination } from '../utils/built.js';
const DATE_RANGE_SCHEMA = {
  startDate: { field: 'createdAt', type: 'dateGte' },
  endDate: { field: 'createdAt', type: 'dateLte' },
};
export const cartSummary = async (req,res,next) => {
  try {
     const db = getDB();
     const abandonHrs = 24;
     const cutoff = new Date(Date.now() - abandonHrs * 60 * 60 * 1000);
     const dateFilter = buildFilter(req.query, {
      startDate: {field:'updatedAt', type: 'dateGte' },
      endDate: {field:'updatedAt', type: 'dateLte' },
    });
     const result=await db.collection("carts").aggregate([
      { $match: dateFilter },
      {
        $group:{
        _id: null,
        totalCarts:{
          $sum: 1
        },
        checkedOutCarts:{
             $sum:{
              $cond:[
               {$eq:["$status","CHECKED_OUT"]},1,0]
             }
        },
        activeCarts:{
            $sum:{
               $cond:[
              {$and:[{ $eq:["$status","ACTIVE"]},{$gte:["$updatedAt",cutoff]}]},1,0]
            }
        },
        abandonedCarts:{
            $sum:{
              $cond:[
               {$and:[{ $eq:["$status","ACTIVE"]},{$lt:["$updatedAt",cutoff]}]},1,0]
            }
        }
        }
      },   
     ]).next();
             
     
    return res.status(200).json({
      success:true,
      message:'Cart summary report',
      data: {
        totalCarts:result?.totalCarts||0,
        activeCarts:result?.activeCarts||0,
        checkedOutCarts:result?.checkedOutCarts||0,
        abandonedCarts:result?.abandonedCarts||0
      }
    });
  } catch (err) {
    next(err);
  }
};

export const productActivityReport = async (req,res,next) => {
  try{
    const db=getDB();
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
     const dateFilter = buildFilter(req.query, DATE_RANGE_SCHEMA);
    const { page, limit, skip } = buildPagination(req.query);
    const result = await db.collection("productActivityLogs").aggregate([
  {
    $facet: {
      mostPopular:[
           {
            $match:{
             action:"ADD",
             updatedAt: {$gte: last30Days}
            }
           },{
            $group:{
              _id:"$productId",
              customerCount:{$sum:1}
            }
          },{
            $lookup:{
              from:"products",
              localField:"_id",
              foreignField:"productId",
              as:"product"
            }
          },{
            $project:{
                _id:0,
                ProductName:{$arrayElemAt: ["$product.name",0]},
                ProductId:"$_id",
                customerCount:1
            }
          },{
            $sort:{
              customerCount:-1}
          },
          {
            $limit : 10
          }
           ],
        productsAdded: [
        {$match: {
            action: "ADD",
            ...dateFilter
          }
        },
        {
          $group:{
            _id:"$productId",
             quantity:{
              $sum: "$quantity"
             } 
          }
        },{
            $lookup:{
              from:"products",
              localField:"_id",
              foreignField:"productId",
              as:"product"
            }
          },{
          $project: {
            _id: 0,
            productName:{$arrayElemAt:["$product.name",0]},
            productId: "$_id",
            quantity: 1
          }
        },
        {
          $sort: {
            quantity: -1
          }},
          { $skip: skip },
            { $limit: limit }
      ],
      productsRemoved: [
        {$match: {
            action: "REMOVE",
            ...dateFilter
          }
        }, {
          $group:{
            _id:"$productId",
             quantity:{
              $sum: "$quantity"
             } 
          }
        },
        {
            $lookup:{
              from:"products",
              localField:"_id",
              foreignField:"productId",
              as:"product"
            }
          },
        {
          $project: {
            _id: 0,
            productName:{$arrayElemAt:["$product.name",0]},
            productId: "$_id",
            quantity: 1
          }
        },
        {
          $sort: {
            quantity: -1
          }},
          { $skip: skip },
            { $limit: limit }
      ]
    }
  }
]).next();

return res.status(200).json({
  success: true,
  data: result,
   pagination: { page, limit }
})
}
catch (err) {
    next(err);
  }
};

export const couponUsageReport = async (req, res, next) => {
  try {
    const db = getDB();
     const dateFilter = buildFilter(req.query, DATE_RANGE_SCHEMA);
    const report = await db.collection("couponUsageLogs").aggregate([
        { $match: dateFilter },
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
    const dateFilter = buildFilter(req.query, DATE_RANGE_SCHEMA);
    const report = await db.collection("checkoutLogs").aggregate([
       { $match: dateFilter },{
        $group: {
          _id: null,
          cartCount:{
            $sum: 1
          },
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
      },
    {
        $project:{
          _id:0,
          successfulCheckouts:1,
          failedCheckouts:1,
          conversionPercentage:{
           $multiply:[{$divide:["$successfulCheckouts","$cartCount"]},100]}
        }
      }
    ]).next();
    const successfulCheckouts=report?.successfulCheckouts||0;
    const failedCheckouts= report?.failedCheckouts||0;
    const conversionPercentage= report?.conversionPercentage||0;
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