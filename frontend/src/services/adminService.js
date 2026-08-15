import httpClient from '../api/httpClient.js'

export async function getAdminDashboard() {
  const { data } = await httpClient.get('/admin/dashboard')
  return data
}

export async function getAdminProducts() {
  const { data } = await httpClient.get('/admin/products')
  return data
}

export async function getAdminProduct(id) {
  const { data } = await httpClient.get(`/admin/products/${id}`)
  return data
}

export async function updateAdminProduct(id, product) {
  const { data } = await httpClient.put(`/admin/products/${id}`, product)
  return data
}

export async function createAdminProduct(product) {
  const { data } = await httpClient.post('/admin/products', product)
  return data
}

export async function deleteAdminProduct(id) {
  const { data } = await httpClient.delete(`/admin/products/${id}`)
  return data
}

export async function getPublicProduct(slug) {
  const { data } = await httpClient.get(`/catalog/products/${slug}`)
  return data
}
