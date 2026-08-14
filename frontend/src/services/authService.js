import httpClient from '../api/httpClient.js'

export async function registerUser(payload) {
  const { data } = await httpClient.post('/auth/register', payload)
  return data
}

export async function loginUser(credentials) {
  const { data } = await httpClient.post('/auth/login', credentials)
  return data
}

export async function getCurrentUser() {
  const { data } = await httpClient.get('/auth/me')
  return data.user ?? data
}

export async function logoutUser() {
  const { data } = await httpClient.post('/auth/logout')
  return data
}

export async function requestPasswordReset(email) {
  const { data } = await httpClient.post('/auth/forgot-password', { email })
  return data
}

export async function resetPassword(token, password) {
  const { data } = await httpClient.post('/auth/reset-password', { token, password })
  return data
}
