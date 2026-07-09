import  bcrypt from 'bcryptjs';
import * as customerModel from'../models/customerModel.js';
export const createCustomer = async (req,res,next) => {
  try {
    const existingEmail = await customerModel.findCustomerByEmail(req.body.email.toLowerCase());
    if (existingEmail ) {
      return res.status(409).json({
        success: false,     
        message:'Email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const customer = await customerModel.createCustomer({ ...req.body, password: hashedPassword });
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: customer
    });
  } catch (err) {
      next(err);
  }
};

export const getCustomer = async (req,res,next) => {
  try {
    const customer = await customerModel.findCustomerById(req.params.customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'No Customer found with this Id' });
    }
    if (req.user.role !== 'admin' && req.user.customerId !== req.params.customerId) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource' });
    }

    return res.status(200).json({
      success: true,
      message: 'Customer fetched successfully',
      data: customer
    });
  } catch (err) {
     next(err);
  }
};

export const listCustomers = async (req,res,next) => {
  try {
      const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const customers = await customerModel.listCustomers(page,limit);
    return res.status(200).json({
      success: true,
      message: 'Customers fetched successfully',
      data: customers
    });
  } catch (err) {
    next(err);
  }
};

export const updateCustomer = async (req,res,next) => {
  try {
    if (req.user.customerId !== req.params.customerId) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource' });
    }
    const existing = await customerModel.findCustomerById(req.params.customerId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'No Customer found with this account' });
    }

    const updated = await customerModel.updateCustomer(req.params.customerId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: updated
    });
  } catch (err) {
    next(err);
  }
};