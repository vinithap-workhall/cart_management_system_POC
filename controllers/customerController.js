import  bcrypt from 'bcryptjs';
import * as customerModel from'../models/customerModel.js';
import { buildFilter, buildSort, buildPagination } from '../utils/built.js';
const CUSTOMER_FILTER_SCHEMA = {
  name:{ field: 'name', type: 'regex' },
  email:{ field: 'email', type: 'regex' },
  role:{ field: 'role', type: 'exact' },
  startDate:{ field: 'createdAt', type: 'dateGte' },
  endDate:{field: 'createdAt', type: 'dateLte' },
};
const CUSTOMER_SORTABLE_FIELDS = ['createdAt', 'name', 'email'];

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
    const filter = buildFilter(req.query, CUSTOMER_FILTER_SCHEMA);
    const sort = buildSort(req.query, CUSTOMER_SORTABLE_FIELDS);
    const { page, limit, skip } = buildPagination(req.query);
    const customers = await customerModel.listCustomers(filter, sort, {skip, limit });
    return res.status(200).json({
      success: true,
      message: 'Customers fetched successfully',
      data: customers,
      pagination: { page, limit }
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