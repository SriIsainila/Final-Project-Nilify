import { Navigate, Outlet, useLocation } from 'react-router-dom'
import RouteLoader from '../components/RouteLoader.jsx'
import { useAuth } from '../context/authContext.js'
import { canAccessUserRoutes } from './roleAccess.js'

export default function UserProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <RouteLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!canAccessUserRoutes(user)) return <Navigate to="/admin/dashboard" replace />
  return <Outlet />
}
