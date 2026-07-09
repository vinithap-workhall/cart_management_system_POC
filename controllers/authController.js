import  jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import * as  customerModel from '../models/customerModel.js';
const JWT_SECRET = process.env.JWT_SECRET ;
const JWT_EXPIRE = '1d';
export const login=async (req, res,next) => {
  try {
    const {email, password} =req.body;
    const customer =await customerModel.findCustomerByEmail(email);
    if (!customer) {
      return res.status(401).json({success:false, message:'Invalid email or password'});
    }

    const passwordMatches = await bcrypt.compare(password, customer.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { customerId:customer.customerId, role:customer.role },
      JWT_SECRET,{expiresIn:JWT_EXPIRE }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        customer: {
          customerId:customer.customerId,
          name:customer.name,
          email:customer.email,
          phone:customer.phone,
          role:customer.role
        }
      }
    });
  } catch(err) {
    next(err);
  }
};