import assert from 'node:assert/strict'
import test from 'node:test'
import { canAccessAdminRoutes, canAccessUserRoutes, homeForRole } from './roleAccess.js'

test('normal users are redirected to the user dashboard', () => {
  assert.equal(homeForRole('user'), '/dashboard')
  assert.equal(canAccessUserRoutes({ role: 'user' }), true)
  assert.equal(canAccessAdminRoutes({ role: 'user' }), false)
})

test('admins are redirected to and restricted to admin routes', () => {
  assert.equal(homeForRole('admin'), '/admin/dashboard')
  assert.equal(canAccessAdminRoutes({ role: 'admin' }), true)
  assert.equal(canAccessUserRoutes({ role: 'admin' }), false)
})

test('unauthenticated visitors cannot access either protected area', () => {
  assert.equal(canAccessUserRoutes(null), false)
  assert.equal(canAccessAdminRoutes(null), false)
})
