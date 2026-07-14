import * as productModel from '../models/productModel.js';
import { buildFilter, buildSort, buildPagination } from '../utils/built.js';

const PRODUCT_FILTER_SCHEMA = {
  name: { field: 'name', type: 'regex' },        
  minPrice: { field: 'price', type: 'gte' },       
  maxPrice: { field: 'price', type: 'lte' },      
  inStock: { field: 'stock', type: 'gt', value: 0 },
};

const PRODUCT_SORTABLE_FIELDS = [ 'price', 'stock', 'name'];

export const createProduct = async (req,res,next) => {
  try {
    const exist = await productModel.findProductById(req.body.productId);
    if (exist) {
      return res.status(409).json({ success: false, message: 'Product with the Id is already available' });
    }
    const product = await productModel.createProduct(req.body);
    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch(err) {
     next(err);
  }
};

export const getProduct = async (req,res,next) => {
  try {
    const product = await productModel.findProductById(req.params.productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Product fetched successfully',
      data: product
    });
  } catch (err) {
      next(err);
  }
};

export const listProducts = async (req,res,next) => {
  try {
    const filter = buildFilter(req.query, PRODUCT_FILTER_SCHEMA);
    const sort = buildSort(req.query, PRODUCT_SORTABLE_FIELDS);
    const {page, limit, skip } = buildPagination(req.query);
    const products = await productModel.listProducts(filter, sort, { skip, limit });
    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: products,
      pagination: {page, limit }
    });
  } catch (err) {
     next(err);
  }
};

export const updateProduct = async (req,res,next) => {
  try {
    const existing = await productModel.findProductById(req.params.productId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product with this ID is not found' });
    }

    const updated = await productModel.updateProduct(req.params.productId, req.body);
    return res.status(200).json({
      success: true,
      message: 'Product details replaced successfully',
      data: updated
    });
  } catch (err) {
     next(err);
  }
};