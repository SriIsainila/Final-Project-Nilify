import { Navigate, Route, Routes } from 'react-router-dom'
import AddProduct from '../pages/AddProduct.jsx'
import AdminDashboard from '../pages/AdminDashboard.jsx'
import AdminProducts from '../pages/AdminProducts.jsx'
import AdminEditProduct from '../pages/AdminEditProduct.jsx'
import AdminAddProduct from '../pages/AdminAddProduct.jsx'
import AdminLogin from '../pages/AdminLogin.jsx'
import Checkout from '../pages/Checkout.jsx'
import ForgotPassword from '../pages/ForgotPassword.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import Landing from '../pages/Landing.jsx'
import Login from '../pages/Login.jsx'
import Notifications from '../pages/Notifications.jsx'
import Pricing from '../pages/Pricing.jsx'
import PublicProduct from '../pages/PublicProduct.jsx'
import Register from '../pages/Register.jsx'
import ResetPassword from '../pages/ResetPassword.jsx'
import GuestRoute from './GuestRoute.jsx'
import AdminProtectedRoute from './AdminProtectedRoute.jsx'
import UserProtectedRoute from './UserProtectedRoute.jsx'
import AdminLayout from '../components/AdminLayout.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/products/:id" element={<PublicProduct />} />

      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<UserProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/add-product" element={<AddProduct />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      <Route element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/add" element={<AdminAddProduct />} />
          <Route path="/admin/products/edit/:id" element={<AdminEditProduct />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
