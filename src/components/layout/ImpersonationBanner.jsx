import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Satellite } from 'lucide-react'

/**
 * ImpersonationBanner
 *
 * Renders a persistent banner while a platform admin is impersonating a
 * tenant admin. Lives in BOTH shells:
 *   - AdminLayout  — where the platform admin lands during impersonation
 *                    (startImpersonation navigates to /dashboard).
 *   - PlatformLayout — safety net in case /platform is opened mid-impersonation.
 *
 * "End session" restores the original platform identity and returns to the
 * Platform Console root.
 */
export default function ImpersonationBanner() {
  const { impersonation, endImpersonation } = useAuth()
  const navigate = useNavigate()

  if (!impersonation) return null

  const handleEnd = async () => {
    await endImpersonation()
    navigate('/platform', { replace: true })
  }

  return (
    <div
      className="w-full shrink-0 text-white text-sm flex items-center justify-center gap-3 px-4 py-2"
      style={{ background: 'linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed)' }}
    >
      <span className="flex items-center gap-2 font-medium">
        <Satellite size={15} />
        Impersonating <strong>{impersonation.tenantName}</strong>
      </span>
      <button
        onClick={handleEnd}
        className="px-3 py-1 rounded-lg font-semibold transition-colors"
        style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
      >
        End session
      </button>
    </div>
  )
}

