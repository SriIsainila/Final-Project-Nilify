import httpClient from '../api/httpClient.js'

export async function getBillingStatus() {
  const { data } = await httpClient.get('/billing/status')
  return data
}

export async function createCheckout(payload) {
  const { data } = await httpClient.post('/payments/payhere/create', payload)
  return data
}

export async function getPaymentStatus(orderId) {
  const { data } = await httpClient.get(`/payments/payhere/${encodeURIComponent(orderId)}/status`)
  return data
}

export function submitHostedCheckout(checkout) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = checkout.checkout_url
  Object.entries(checkout.fields).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}
