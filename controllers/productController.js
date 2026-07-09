import * as productModel from '../models/productModel.js';

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
    const page = Number(req.query.page) > 0 ? Number(req.query.page) : 1;
    const limit = Number(req.query.limit) > 0 ? Number(req.query.limit) : 10;
    const products = await productModel.listProducts(page,limit);
    return res.status(200).json({
      success: true,
      message: 'Products fetched successfully',
      data: products
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