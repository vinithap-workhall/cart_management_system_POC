import Joi from 'joi';

const createProductSchema = Joi.object({
  productId: Joi.string().trim().min(2).max(20).required(),
  name: Joi.string().trim().min(2).max(150).required(),
  price: Joi.number().positive().precision(2).min(1).max(100000000).required().messages({'number.max':'Must be less than 100000000 '}),
  stock: Joi.number().integer().min(1).max( 1000000).required()
});

const updateProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  price: Joi.number().positive().precision(2).min(1).max(100000000).required(),
  stock: Joi.number().integer().min(1).max( 1000000).required()
});

export {createProductSchema,updateProductSchema};
