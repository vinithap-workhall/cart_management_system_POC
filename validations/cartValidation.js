import Joi from 'joi';

const createCartSchema = Joi.object({});

const addItemSchema = Joi.object({
  productId: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).max(10000).required().messages({
    'number.min': 'Quantity must be greater than zero'
  })
});

const updateItemSchema = Joi.object({
   productId: Joi.string().trim().required(),
  quantity: Joi.number().integer().min(1).max(10000).required().messages({
    'number.min': 'Quantity must be greater than zero'
  })
});

export{createCartSchema, addItemSchema, updateItemSchema };
