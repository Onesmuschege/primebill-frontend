import { useQuery } from '@tanstack/react-query'
import { getAdminRoles, getAdminPermissions } from '../../api/admin.api'
import Spinner from '../../components/common/Spinner'
import { Shield, Check } from 'lucide-react'

export default function AdminRoles() {
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => getAdminRoles(),
  })

  const { data: permissionsData } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: () => getAdminPermissions(),
  })

  const roles = Array.isArray(rolesData?.data) ? rolesData.data
    : rolesData?.data?.data || []
  const permissions = permissionsData?.data?.data || {}

  if (rolesLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
        {roles.length} role{roles.length !== 1 ? 's' : ''} configured
      </p>

      <div className="space-y-4">
        {roles.map(role => (
          <div key={role.id} className="card p-4">
            <div className="flex items-start gap-3 mb-3">
              <Shield size={18} className="text-primary-600 mt-1" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{role.name}</h3>
                <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
                  {role.permissions?.length || 0} permission{role.permissions?.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {role.permissions && role.permissions.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3" style={{ borderTop: '1px solid var(--pb-border)' }}>
                {role.permissions.map(perm => (
                  <div key={perm.id} className="flex items-center gap-2 text-xs">
                    <Check size={14} className="text-green-600" />
                    <span style={{ color: 'var(--pb-text-2)' }}>{perm.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
