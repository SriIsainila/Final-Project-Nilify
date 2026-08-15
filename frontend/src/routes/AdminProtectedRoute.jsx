import { Navigate, Outlet, useLocation } from 'react-router-dom'
import RouteLoader from '../components/RouteLoader.jsx'
import { useAuth } from '../context/authContext.js'
import { canAccessAdminRoutes } from './roleAccess.js'

export default function AdminProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <RouteLoader />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (!canAccessAdminRoutes(user)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
