import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login as loginApi, logout as logoutApi, registerTenant as registerTenantApi } from '../api/auth.api'
import { challengeMfa as challengeMfaApi } from '../api/mfa.api'
import { impersonateTenant, endImpersonation as endImpersonationApi } from '../api/platform.api'
import { SESSION_EXPIRED_EVENT } from '../api/axiosInstance'

const AuthContext = createContext(null)

// Impersonation is stored per-key in localStorage so it survives SPA reloads.
const IMP_KEY = 'pb-impersonation'
const ORIG_TOKEN_KEY = 'pb-original-token'

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => JSON.parse(localStorage.getItem('user')))
  const [token, setToken]     = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(false)
  const navigate              = useNavigate()

  // ---------------------------------------------------------------------------
  // Impersonation state — a platform admin temporarily assumes a tenant admin's
  // identity. We keep the ORIGINAL platform token + user separately so we can
  // switch back trivially. While impersonating, the AuthContext exposes the
  // tenant admin's user so the tenant app renders & authorises correctly, and
  // the PlatformLayout/Tenant shell shows a persistent "Impersonating" banner.
  // ---------------------------------------------------------------------------
  const [impersonation, setImpersonation] = useState(() => JSON.parse(localStorage.getItem(IMP_KEY)))
  const [originalUser, setOriginalUser]   = useState(() => JSON.parse(localStorage.getItem('pb-original-user')))
  const [originalToken, setOriginalToken] = useState(() => localStorage.getItem(ORIG_TOKEN_KEY))

  // ---------------------------------------------------------------------------
  // clearSession — single source of truth for wiping auth state.
  // Called by both logout() and the session expiry handler.
  // useCallback so the session expiry effect dependency array is stable.
  // ---------------------------------------------------------------------------
  const clearSession = useCallback(() => {
    setUser(null)
    setToken(null)
    setImpersonation(null)
    setOriginalUser(null)
    setOriginalToken(null)
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem(IMP_KEY)
    localStorage.removeItem(ORIG_TOKEN_KEY)
    localStorage.removeItem('pb-original-user')
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
  //
  // Returns { success:true, user } on a normal login. If the account has MFA
  // enabled the backend responds with { mfa_required:true, mfa_token, user } and
  // NO session token — we must NOT accept that as a completed login. Instead we
  // remember nothing in localStorage, hold the mfa_token in component state, and
  // return { success:true, mfaRequired:true, mfaToken, mfaUser } so the Login
  // page can present the code step and then call completeMfaChallenge().
  // ---------------------------------------------------------------------------
  const login = async (credentials) => {
    setLoading(true)
    try {
      const res = await loginApi(credentials)
      const data = res.data.data

      // MFA-protected account — pause login for the TOTP/backup-code step.
      if (data.mfa_required === true) {
        return {
          success: true,
          mfaRequired: true,
          mfaToken: data.mfa_token,
          mfaUser: data.user,
        }
      }

      const { user, token } = data
      setUser(user)
      setToken(token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      // Return the resolved user so callers can branch on is_platform_admin
      // (e.g. Login redirects platform admins to /platform, tenants to /dashboard).
      return { success: true, user }
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
  // completeMfaChallenge — finishes an MFA-paused login. Exchanges the short-lived
  // mfa_token + TOTP/backup code for the real session token, then sets the session
  // exactly like a normal login (single source of truth: clearSession never
  // involved, impersonation keys never written).
  // ---------------------------------------------------------------------------
  const completeMfaChallenge = useCallback(async (mfaToken, code) => {
    setLoading(true)
    try {
      const res = await challengeMfaApi(mfaToken, code)
      const { token, user } = res.data
      setUser(user)
      setToken(token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      return { success: true, user }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid verification code.',
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // ---------------------------------------------------------------------------
  // registerTenant — ISP self-signup. Same session-setting shape as login,
  // since the new admin is logged straight into their fresh workspace.
  // ---------------------------------------------------------------------------
  const registerTenant = async (payload) => {
    setLoading(true)
    try {
      const res = await registerTenantApi(payload)
      const { user, token, tenant } = res.data.data
      setUser(user)
      setToken(token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
      return { success: true, tenant }
    } catch (err) {
      const errors = err.response?.data?.errors
      const firstError = errors ? Object.values(errors)[0]?.[0] : null
      return {
        success: false,
        message: firstError || err.response?.data?.message || 'Could not create your workspace. Please try again.',
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
  // startImpersonation — platform admin enters a tenant context. Calls the
  // existing platform endpoint (which issues an impersonation token for the
  // tenant's admin user), swaps the active token/user to that admin, and keeps
  // the original platform token+user in storage so we can restore on exit.
  // ---------------------------------------------------------------------------
  const startImpersonation = useCallback(async (tenantId, tenantName) => {
    setLoading(true)
    try {
      const res = await impersonateTenant(tenantId)
      const data = res.data.data

      // Keep the original platform identity so we can switch back.
      setOriginalUser(user)
      setOriginalToken(token)
      localStorage.setItem('pb-original-user', JSON.stringify(user))
      localStorage.setItem(ORIG_TOKEN_KEY, token)

      // Build the tenant-admin user object from the response and switch to it.
      const admin = data.admin || {}
      const tenant = data.tenant || { id: tenantId, name: tenantName }
      const impersonatedUser = {
        ...user,
        id: admin.id,
        name: admin.name,
        email: admin.email,
        // Roles are read from the DB server-side for the impersonated admin; we
        // fall back to a minimal admin flag so the tenant UI authorises correctly.
        roles: ['admin'],
        permissions: [],
        // SECURITY: an impersonated tenant admin must NEVER inherit the
        // platform-admin flag from the operator who started the session. The
        // backend also re-checks is_platform_admin on every /api/platform/*
        // request via the platform_admin middleware, so this is defence in
        // depth: it also keeps the tenant UI from even attempting /platform
        // navigation and matches what the impersonated token can actually do.
        is_platform_admin: false,
      }

      setUser(impersonatedUser)
      setToken(data.token)
      localStorage.setItem('user', JSON.stringify(impersonatedUser))
      localStorage.setItem('token', data.token)

      const imp = {
        tenantId: tenant.id,
        tenantName: tenant.name || tenantName,
        adminId: admin.id,
        adminEmail: admin.email,
      }
      setImpersonation(imp)
      localStorage.setItem(IMP_KEY, JSON.stringify(imp))

      toast.success(`Impersonating ${tenant.name || tenantName}`)
      return { success: true, tenant }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start impersonation')
      return { success: false, message: err.response?.data?.message || 'Could not start impersonation' }
    } finally {
      setLoading(false)
    }
  }, [user, token])

  // ---------------------------------------------------------------------------
  // endImpersonation — platform admin exits the tenant context and returns to
  // their own platform identity. Restores the original token+user and ends the
  // impersonation server-side (which also writes the audit trail).
  // ---------------------------------------------------------------------------
  const endImpersonation = useCallback(async () => {
    try {
      await endImpersonationApi()
    } catch {
      // Swallow — we restore locally regardless.
    }

    // Restore the original platform identity.
    if (originalToken) {
      setToken(originalToken)
      localStorage.setItem('token', originalToken)
    }
    if (originalUser) {
      setUser(originalUser)
      localStorage.setItem('user', JSON.stringify(originalUser))
    }

    setImpersonation(null)
    setOriginalUser(null)
    setOriginalToken(null)
    localStorage.removeItem(IMP_KEY)
    localStorage.removeItem(ORIG_TOKEN_KEY)
    localStorage.removeItem('pb-original-user')

    toast.success('Impersonation ended')
    return { success: true }
  }, [originalToken, originalUser])

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
  //
  // isPlatformAdmin — deliberately NOT part of the role hierarchy above.
  // It's PrimeBill's own cross-tenant operator flag (users.is_platform_admin
  // on the backend), orthogonal to a user's tenant-scoped role. A user can
  // be 'staff' in their home tenant AND a platform admin at the same time.
  // Only gates the /platform/* routes — never implied by any role check.
  // ---------------------------------------------------------------------------
  const ROLE_LEVELS = { client: 0, staff: 1, admin: 2, super_admin: 3 }

  const primaryRole = user?.roles?.[0] ?? 'client'
  const isPlatformAdmin = user?.is_platform_admin === true

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
      completeMfaChallenge,
      logout,
      registerTenant,
      impersonation,
      startImpersonation,
      endImpersonation,
      hasRole,
      hasPermission,
      isAtLeast,
      primaryRole,
      isPlatformAdmin,
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