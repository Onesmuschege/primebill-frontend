import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Required when supports_credentials: true is set in Laravel's CORS config.
  // Ensures cookies (Sanctum CSRF) are sent cross-origin for the client portal.
  // Has no effect on Bearer token auth but must be consistent with the server.
  withCredentials: true,
})

// ---------------------------------------------------------------------------
// Session expiry event bus
//
// The interceptor lives outside React. It cannot call useAuth() or touch
// React state directly. Instead it fires a CustomEvent on window. AuthContext
// listens for this event and calls its own logout() + shows a toast, then
// React Router's <Navigate> handles the redirect.
//
// Using an event instead of window.location.href means:
//   - No full page reload (React state preserved until redirect)
//   - The toast notification actually renders before the redirect
//   - The redirect goes through React Router (history is preserved correctly)
// ---------------------------------------------------------------------------
export const SESSION_EXPIRED_EVENT = 'primebill:session-expired'

export function dispatchSessionExpired() {
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
}

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — handle 401
//
// THREE BUGS FIXED FROM THE ORIGINAL:
//
// Bug 1: window.location.href bypass — replaced with dispatchSessionExpired()
//   so React Router handles the redirect without a full page reload.
//
// Bug 2: Login 401 swallowed — the interceptor was catching wrong-password 401s
//   on /auth/login and redirecting before AuthContext.login()'s catch() ran,
//   leaving the user on a blank screen with no error message. Fixed by checking
//   config.url and skipping session-expiry logic for auth endpoints.
//
// Bug 3: Concurrent 401 race — if 5 requests fire and all 401, the interceptor
//   fires 5 times. Five localStorage.removeItem() + five window.location.href
//   calls. Fixed with a module-level flag (isHandlingExpiry) that ensures the
//   event is dispatched exactly once per session expiry.
// ---------------------------------------------------------------------------
let isHandlingExpiry = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const requestUrl = error.config?.url ?? ''

    // Auth endpoints return 401 for wrong credentials — do NOT treat those
    // as session expiry. Let the error propagate to the caller's catch block.
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/portal/login') ||
      requestUrl.includes('/auth/password')

    if (status === 401 && !isAuthEndpoint) {
      if (!isHandlingExpiry) {
        isHandlingExpiry = true
        dispatchSessionExpired()

        // Reset the flag after a short delay so that if the user logs back in
        // during the same browser session and then their new token expires,
        // the expiry logic fires again correctly.
        setTimeout(() => {
          isHandlingExpiry = false
        }, 5000)
      }
    }

    return Promise.reject(error)
  }
)

// ---------------------------------------------------------------------------
// unwrapList — normalise paginated API responses
//
// Handles three shapes Laravel can return:
//   1. { data: [] }                        — plain array
//   2. { data: [], meta: {} }              — flat paginated
//   3. { data: { data: [], meta: {} } }    — double-wrapped resource collection
// ---------------------------------------------------------------------------
export function unwrapList(response) {
  const body = response.data

  if (Array.isArray(body)) {
    return { data: body, meta: {} }
  }
  if (Array.isArray(body.data)) {
    return { data: body.data, meta: body.meta || {} }
  }
  if (body.data && Array.isArray(body.data.data)) {
    return { data: body.data.data, meta: body.data.meta || {} }
  }
  return { data: [], meta: {} }
}

export default api