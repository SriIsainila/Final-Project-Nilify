export function homeForRole(role) {
  return role === 'admin' ? '/admin/dashboard' : '/dashboard'
}

export function canAccessUserRoutes(user) {
  return user?.role === 'user'
}

export function canAccessAdminRoutes(user) {
  return user?.role === 'admin'
}
