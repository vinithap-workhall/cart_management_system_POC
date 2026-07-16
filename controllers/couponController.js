import * as cartModel from "../models/cartModel.js";
import * as couponModel from "../models/couponModel.js";
import { logCouponUsage } from "../models/couponUsageLogModel.js";
import { ObjectId } from "mongodb";
export const createCoupon = async (req, res, next) => {
  try {
    const existing = await couponModel.findCouponByCode(req.body.couponCode);
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: "Coupon code already exists" });
    }
    const coupon = await couponModel.createCoupon(req.body);
    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
};

export const getCoupon = async (req, res, next) => {
  try {
    const coupon = await couponModel.findCouponByCode(req.params.couponCode);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Coupon fetched successfully",
      data: coupon,
    });
  } catch (err) {
    next(err);
  }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const { couponCode } = req.body;
    const cart = await cartModel.findCartById(cartId);
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    if (cart.customerId !== req.user.customerId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You do not have access to this cart",
        });
    }
    if (cart.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot modify a checked-out cart" });
    }
    if (cart.items.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Cannot apply a coupon to an empty cart",
        });
    }

    const coupon = await couponModel.findCouponByCode(couponCode);
    if (!coupon) {
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });
    }

    if (!coupon.isActive) {
      return res
        .status(400)
        .json({ success: false, message: "Coupon is not active" });
    }

    cart.couponCode = coupon.couponCode;
    cart.discountPercentage = coupon.discountPercentage;
    const updatedCart = await cartModel.couponRecal(cart);
    await logCouponUsage(coupon.couponCode, cart.cartId, cart.discount);
    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      data: updatedCart,
    });
  } catch (err) {
    next(err);
  }
};

export const removeCoupon = async (req, res, next) => {
  try {
    const { cartId } = req.params;
    const cart = await cartModel.findCartById(cartId);
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }
    if (cart.customerId !== req.user.customerId) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You do not have access to this cart",
        });
    }
    if (cart.couponCode === null) {
      return res
        .status(404)
        .json({
          success: false,
          message: "This card does not have couponCode",
        });
    }
    if (cart.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ success: false, message: "Cannot modify a checked-out cart" });
    }
    await logCouponUsage(cart.couponCode, cart.cartId, 0);
    cart.couponCode = null;
    cart.discountPercentage = 0;
    const updatedCart = await cartModel.couponRecal(cart);

    return res.status(200).json({
      success: true,
      message: "Coupon removed successfully",
      data: updatedCart,
    });
  } catch (err) {
    next(err);
  }
};
