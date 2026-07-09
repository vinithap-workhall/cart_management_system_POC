import Joi from 'joi';
const createCouponSchema = Joi.object({
  couponCode:Joi.string().trim().uppercase().min(3).max(20).required(),
  discountPercentage:Joi.number().min(1).max(100).required(),
  isActive:Joi.boolean().default(true)
});

const applyCouponSchema = Joi.object({
  couponCode: Joi.string().trim().required()
});






export {createCouponSchema, applyCouponSchema };
