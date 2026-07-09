import Joi from 'joi';

const createCustomerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  phone: Joi.string().trim().pattern(/^[0-9]{10}$/).required().messages({ 'string.pattern.base':
    'Phone number must be 10 digits' }),
  address: Joi.string().trim().min(5).max(200).required(),
  password: Joi.string().trim().min(6).max(15).required()
});

const updateCustomerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string().trim().pattern(/^[0-9]{10}$/).required()
    .messages({ 'string.pattern.base': 'Phone number must be 10 digits' }),
  address: Joi.string().trim().min(5).max(200).required(),
}); 

export {createCustomerSchema,updateCustomerSchema};
