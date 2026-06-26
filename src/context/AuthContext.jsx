import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login as loginApi, logout as logoutApi } from '../api/auth.api'
import { SESSION_EXPIRED_EVENT } from '../api/axiosInstance'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem('user')))
  const [token, setToken]     = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const navigate              = useNavigate()

  // ---------------------------------------------------------------------------
  // clearSession — single source of truth for wiping auth state.
  // Called by both logout() and the session expiry handler.
  // useCallback so the session expiry effect dependency array is stable.
  // ---------------------------------------------------------------------------
  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }, [])

  // ---------------------------------------------------------------------------
  // Session expiry listener
  //
  // The Axios interceptor cannot touch React state or useNavigate — it lives
  // outside the React tree. It fires SESSION_EXPIRED_EVENT on window instead.
  // We listen here, clear state, show a toast, then redirect via React Router.
  //
  // useRef guard: React strict mode mounts effects twice in development.
  // The ref ensures we only register one listener even in double-mount.
  // ---------------------------------------------------------------------------
  const sessionExpiredHandlerRef = useRef(null)

  useEffect(() => {
    const handleSessionExpired = () => {
      // Only act if there was actually a session to expire.
      // Prevents the toast firing on a fresh page load where token is null.
      if (!localStorage.getItem('token')) return

      clearSession()
      toast.error('Your session has expired. Please log in again.', {
        id: 'session-expired', // Deduplicate — only one toast even if fired twice.
        duration: 4000,
      })
      navigate('/login', { replace: true })
    }

    // Remove any previous listener before adding a new one (handles StrictMode
    // double-mount and hot-reloads without stacking duplicate listeners).
    if (sessionExpiredHandlerRef.current) {
      window.removeEventListener(SESSION_EXPIRED_EVENT, sessionExpiredHandlerRef.current)
    }

    sessionExpiredHandlerRef.current = handleSessionExpired
    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired)
    }
  }, [clearSession, navigate])

  // ---------------------------------------------------------------------------
  // login
  // ---------------------------------------------------------------------------
  const login = async (credentials) => {
    setLoading(true)
    try {
      const res = await loginApi(credentials)
      const { user, token } = res.data.data
      setUser(user)
      setToken(token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      return { success: true }
    } catch (err) {
      // 401 on login means wrong credentials — the Axios interceptor correctly
      // skips session-expiry logic for auth endpoints, so this catch block runs.
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid email or password.',
      }
    } finally {
      setLoading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // logout — explicit user-initiated logout
  // ---------------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await logoutApi()
    } catch {
      // Swallow — token may already be invalid. We always clear locally.
    } finally {
      clearSession()
      navigate('/login', { replace: true })
    }
  }, [clearSession, navigate])

  // ---------------------------------------------------------------------------
  // Role and permission helpers
  //
  // hasRole('admin')         — true if user has that exact role
  // hasPermission('...')     — true if user has that permission, OR is super_admin
  // isAtLeast('staff')       — true if user's role is at least as privileged
  //                            as the given role (used by ProtectedRoute)
  //
  // Role hierarchy (least → most privileged):
  //   client → staff → admin → super_admin
  // ---------------------------------------------------------------------------
  const ROLE_LEVELS = { client: 0, staff: 1, admin: 2, super_admin: 3 }

  const primaryRole = user?.roles?.[0] ?? 'client'

  const hasRole = useCallback((role) => {
    return user?.roles?.includes(role) ?? false
  }, [user])

  const hasPermission = useCallback((permission) => {
    if (user?.roles?.includes('super_admin')) return true
    return user?.permissions?.includes(permission) ?? false
  }, [user])

  const isAtLeast = useCallback((minimumRole) => {
    const userLevel    = ROLE_LEVELS[primaryRole]    ?? 0
    const minimumLevel = ROLE_LEVELS[minimumRole] ?? 0
    return userLevel >= minimumLevel
  }, [primaryRole])

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      hasRole,
      hasPermission,
      isAtLeast,
      primaryRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}