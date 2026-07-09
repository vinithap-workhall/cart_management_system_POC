import 'dotenv/config';
import express from 'express';
import {connectDB} from './config/db.js';
import  errorHandler from './middlewares/errorHandler.js';
import customerRoutes from'./routes/customerRoutes.js';
import  productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import  orderRoutes from './routes/orderRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import  authRoutes from './routes/authRoutes.js';
const app = express();
app.use(express.json());
app.get('/', (req, res) => {
  res.json({ message: 'Cart Management System API is running' });
});

app.use('/api/customers',customerRoutes);
app.use('/api/products',productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/coupons',couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin',reportRoutes);
app.use('/api/auths',authRoutes);
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});
app.use(errorHandler);

const PORT = process.env.PORT ;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
