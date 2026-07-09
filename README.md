# Cart Management System

## Personas
- Customer
- Admin

## Environment Variables

Create a `.env` file

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017
DB_NAME=cart_management_system
JWT_SECRET=your_jwt_secret_here
```

## Customer Management APIs
- `POST /api/customers`
- `GET /api/customers/{customerId}`
- `GET /api/customers`
- `PUT /api/customers/{customerId}`

## Product Management APIs
- `POST /api/products`
- `GET /api/products/{productId}`
- `GET /api/products`
- `PUT /api/products/{productId}`

## Cart Management APIs
- `POST /api/carts`
- `GET /api/carts/{cartId}`
- `POST /api/carts/{cartId}/items`
- `PUT /api/carts/{cartId}/items/{itemId}`
- `DELETE /api/carts/{cartId}/items/{itemId}`
- `GET /api/customers/{customerId}/carts`

## Coupon Management APIs
- `POST /api/carts/{cartId}/coupon`
- `DELETE /api/carts/{cartId}/coupon`
- `GET /api/coupons/{couponCode}`

## Checkout APIs
- `POST /api/carts/{cartId}/checkout`
- `GET /api/orders/{orderId}`
- `GET /api/customers/{customerId}/orders`

## Reporting APIs

### Cart Summary
**GET** `/api/admin/carts/report`

Returns:
- Total carts
- Active carts
- Checked-out carts
- Abandoned carts

### Product Activity Report
**GET** `/api/admin/products/cart-report`

Returns:
- Products added to carts
- Products removed from carts
- Most popular products

### Coupon Usage Report
**GET** `/api/admin/coupons/report`

Returns:
- Coupon usage count
- Total discount amount

### Checkout Report
**GET** `/api/admin/checkouts/report`

Returns:
- Successful checkouts
- Failed checkouts
- Conversion percentage