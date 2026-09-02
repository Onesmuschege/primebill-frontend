import { useQuery } from '@tanstack/react-query'
import { getPlatformUsers } from '../../api/platform.api'
import Table from '../../components/common/Table'
import Spinner from '../../components/common/Spinner'
import { formatDateTime } from '../../utils/formatDate'
import { Users, ShieldCheck, KeyRound, Lock } from 'lucide-react'

/**
 * READ-ONLY list of who currently holds platform-admin access.
 *
 * is_platform_admin is deliberately the single highest-privilege flag in the
 * app — it bypasses tenant scoping entirely — so it is intentionally NOT
 * grantable/revocable through the UI or any API endpoint. The only way to
 * change it is `php artisan platform:make-admin {email}`. That's why this page
 * has no create/edit/delete UI of any kind.
 */
export default function PlatformUsers() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['platform-users'],
    queryFn: () => getPlatformUsers(),
    refetchInterval: 60000,
  })

  const note = data?.note || ''
  const users = Array.isArray(data?.users) ? data.users : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--pb-text-1)' }}>
            <Users size={18} style={{ color: '#a78bfa' }} />
            Platform Users
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            Who currently holds cross-tenant platform-admin access.
          </p>
        </div>
      </div>

      {/* CLI-only security note — mirrored from the backend note field */}
      <div
        className="p-4 rounded-xl text-xs leading-relaxed flex items-start gap-3"
        style={{ background: 'rgba(139,92,246,0.14)', border: '1px dashed rgba(167,139,250,0.3)', color: 'var(--pb-text-2)' }}
      >
        <Lock size={16} className="shrink-0 mt-0.5" style={{ color: '#a78bfa' }} />
        <div>
          <p className="font-semibold mb-1 flex items-center gap-1.5" style={{ color: '#a78bfa' }}>
            <ShieldCheck size={12} /> Deliberately no grant / revoke UI
          </p>
          <p>{note || 'Platform-admin access is granted and revoked via the CLI only — `php artisan platform:make-admin {email}` — for security reasons.'}</p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="py-16"><Spinner size="md" /></div>
        ) : isError ? (
          <div className="py-16 text-sm text-center" style={{ color: 'var(--pb-text-3)' }}>
            Failed to load platform users. Please try again.
          </div>
        ) : (
          <Table
            columns={[
              { key: 'name', label: 'Name', render: (u) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{u.name}</p>
                    <p className="text-xs flex items-center gap-1" style={{ color: '#a78bfa' }}>
                      <KeyRound size={10} /> Platform Admin
                    </p>
                  </div>
                </div>
              ) },
              { key: 'email', label: 'Email', render: (u) => <span style={{ color: 'var(--pb-text-2)' }}>{u.email}</span> },
              { key: 'last_login', label: 'Last Login', render: (u) => (
                <span style={{ color: 'var(--pb-text-3)' }}>{u.last_login ? formatDateTime(u.last_login) : '—'}</span>
              ) },
              { key: 'created_at', label: 'Member Since', render: (u) => (
                <span style={{ color: 'var(--pb-text-3)' }}>{formatDateTime(u.created_at)}</span>
              ) },
            ]}
            data={users}
            emptyMessage="No platform admins configured"
          />
        )}
      </div>

      <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
        This list is read-only. Access changes are made from a trusted machine via the
        <code className="mx-1 px-1.5 py-0.5 rounded" style={{ background: 'var(--pb-raised)' }}>platform:make-admin</code>
        artisan command only.
      </p>
    </div>
  )
}