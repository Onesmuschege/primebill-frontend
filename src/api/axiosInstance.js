import axios from 'axios'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// Request interceptor - add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

/**
 * Normalize a paginated API response into { data: [], meta: {} }
 * Handles both:
 *   - { data: { data: [], meta: {} } }  (Laravel Resource Collection)
 *   - { data: [], meta: {} }            (flat)
 */
export function unwrapList(response) {
  const body = response.data

  // Case 1: body itself is an array  → { data: [] }
  if (Array.isArray(body)) {
    return { data: body, meta: {} }
  }
  // Case 2: body.data is an array (flat paginated) → { data: [], meta: {} }
  if (Array.isArray(body.data)) {
    return { data: body.data, meta: body.meta || {} }
  }
  // Case 3: body.data is an object with nested data array (double-wrapped)
  if (body.data && Array.isArray(body.data.data)) {
    return { data: body.data.data, meta: body.data.meta || {} }
  }
  // Fallback
  return { data: [], meta: {} }
}

export default api