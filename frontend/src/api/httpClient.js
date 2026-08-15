import axios from 'axios'

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new Event('auth:unauthorized'))
    }

    const backendUnavailable = (!error.response && error.code === 'ERR_NETWORK')
      || error.response?.status === 502
    const message = backendUnavailable
      ? 'Backend is unavailable. Start the API server on port 5000 and try again.'
      : error.response?.data?.message || error.message || 'Something went wrong'
    return Promise.reject(new Error(message))
  },
)

export default httpClient
