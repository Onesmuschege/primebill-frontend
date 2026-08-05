import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * ProtectedRoute
 *
 * Usage:
 *
 *   // Auth-only (any logged-in user)
 *   <ProtectedRoute>
 *     <Dashboard />
 *   </ProtectedRoute>
 *
 *   // Minimum role required (hierarchy: client < staff < admin < super_admin)
 *   <ProtectedRoute minimumRole="admin">
 *     <Settings />
 *   </ProtectedRoute>
 *
 *   // Exact role match (use sparingly — prefer minimumRole)
 *   <ProtectedRoute roles={['super_admin']}>
 *     <DangerZone />
 *   </ProtectedRoute>
 *
 *   // Permission-based (maps to Spatie permissions on the backend)
 *   <ProtectedRoute permission="view reports">
 *     <Reports />
 *   </ProtectedRoute>
 *
 *   // Platform-admin only (cross-tenant PrimeBill-operator routes)
 *   <ProtectedRoute requirePlatformAdmin>
 *     <PlatformDashboard />
 *   </ProtectedRoute>
 *
 * Redirect behaviour:
 *   - Not logged in             → /login     (with `from` state for post-login redirect)
 *   - Logged in but wrong role  → /unauthorized
 *   - Logged in, not a platform admin → /unauthorized
 *
 * Props:
 *   children             ReactNode   Required. The page component to render.
 *   minimumRole           string      Optional. Least-privileged role allowed (inclusive).
 *   roles                 string[]    Optional. Exact roles allowed. Overrides minimumRole
 *                                     if both are provided (prefer minimumRole for most cases).
 *   permission             string      Optional. Spatie permission string that must be present.
 *   requirePlatformAdmin   boolean     Optional. Gates on users.is_platform_admin — deliberately
 *                                     independent of roles/permission, which are always
 *                                     tenant-scoped. Checked client-side here as a UX guard;
 *                                     the backend's platform_admin middleware is the real
 *                                     enforcement and re-checks this on every request.
 */
export default function ProtectedRoute({ children, minimumRole, roles, permission, requirePlatformAdmin }) {
  const { token, hasRole, hasPermission, isAtLeast, isPlatformAdmin } = useAuth()
  const location = useLocation()

  // Step 1: Not authenticated at all → redirect to login.
  // Pass `from` so the login page can redirect back after successful login.
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Step 2: Role list check (exact match against any role in the array).
  if (roles && roles.length > 0) {
    const allowed = roles.some((r) => hasRole(r))
    if (!allowed) {
      return <Navigate to="/unauthorized" replace />
    }
  }

  // Step 3: Minimum role check (hierarchy-based — most common case).
  if (minimumRole && !isAtLeast(minimumRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Step 4: Permission check (Spatie permission string).
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Step 5: Platform-admin check — independent of the role/permission checks
  // above, since is_platform_admin sits outside the tenant-scoped hierarchy.
  if (requirePlatformAdmin && !isPlatformAdmin) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}