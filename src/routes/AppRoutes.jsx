import { Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import Catalog from '../pages/Catalog'
import ProductDetail from '../pages/ProductDetail'
import Cart from '../pages/Cart'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import Dashboard from '../pages/Dashboard'
import Checkout from '../pages/Checkout'
import Payment from '../pages/Payment'
import OrderConfirm from '../pages/OrderConfirm'
import NotFound from '../pages/NotFound'
import OtpVerify from '../pages/OtpVerify'   // OTP page

export default function AppRoutes(){
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/catalog" element={<Catalog />} />
      <Route path="/catalog/:category" element={<Catalog />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/payment" element={<Payment />} />
      <Route path="/order-confirmation/:orderId" element={<OrderConfirm />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/verify-otp" element={<OtpVerify />} /> {/* OTP route */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
