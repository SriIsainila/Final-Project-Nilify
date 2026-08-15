import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'
import RouteLoader from '../components/RouteLoader.jsx'
import { homeForRole } from './roleAccess.js'

export default function GuestRoute() {
  const { user, loading } = useAuth()

  if (loading) return <RouteLoader />
  if (user) return <Navigate to={homeForRole(user.role)} replace />
  return <Outlet />
}
