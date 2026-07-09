import Joi from 'joi';

const loginSchema = Joi.object({
  email: Joi.string().trim().email().required(),
  password: Joi.string().trim().required()
});

export {loginSchema};