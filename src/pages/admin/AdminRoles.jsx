import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { getRoles, getPermissions, syncRolePermissions } from '../../api/admin.api'
import toast from 'react-hot-toast'

export default function AdminRoles() {
  const [expanded, setExpanded] = useState(null)
  const [selected, setSelected] = useState({}) // roleId → Set of permission names
  const qc = useQueryClient()

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles().then(r => r.data.data),
  })

  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => getPermissions().then(r => r.data.data),
  })

  const syncMutation = useMutation({
    mutationFn: ({ roleId, perms }) => syncRolePermissions(roleId, { permissions: perms }),
    onSuccess: () => { toast.success('Permissions saved'); qc.invalidateQueries(['roles']) },
    onError: () => toast.error('Failed to save permissions'),
  })

  const toggleExpand = (role) => {
    if (expanded === role.id) { setExpanded(null); return }
    setExpanded(role.id)
    setSelected(prev => ({
      ...prev,
      [role.id]: new Set(role.permissions.map(p => p.name)),
    }))
  }

  const togglePerm = (roleId, permName) => {
    setSelected(prev => {
      const s = new Set(prev[roleId] || [])
      s.has(permName) ? s.delete(permName) : s.add(permName)
      return { ...prev, [roleId]: s }
    })
  }

  // Group permissions by resource name (e.g. "view clients" → "clients")
  const grouped = permissions.reduce((acc, p) => {
    const group = p.name.split(' ').slice(1).join(' ') || 'general'
    ;(acc[group] = acc[group] || []).push(p)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Administrator Roles</h1>
          <p className="page-subtitle">Configure role permissions</p>
        </div>
      </div>

      <div className="space-y-3">
        {roles.map(role => (
          <div key={role.id} className="card p-0 overflow-hidden">
            <button
              onClick={() => toggleExpand(role)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <Shield size={18} style={{ color: '#60a5fa' }} />
                <div className="text-left">
                  <p className="font-semibold capitalize">{role.name.replace(/_/g, ' ')}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
                    {role.permissions?.length || 0} permissions
                  </p>
                </div>
              </div>
              {expanded === role.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expanded === role.id && (
              <div className="px-5 pb-5 border-t" style={{ borderColor: 'var(--pb-border)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                  {Object.entries(grouped).map(([group, perms]) => (
                    <div key={group} className="rounded-lg p-3"
                      style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 capitalize"
                        style={{ color: 'var(--pb-text-2)' }}>{group}</p>
                      {perms.map(p => (
                        <label key={p.id} className="flex items-center gap-2 py-1 cursor-pointer">
                          <input type="checkbox"
                            checked={selected[role.id]?.has(p.name) || false}
                            onChange={() => togglePerm(role.id, p.name)}
                            className="rounded"
                          />
                          <span className="text-xs capitalize">{p.name.split(' ')[0]}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => syncMutation.mutate({
                      roleId: role.id,
                      perms: Array.from(selected[role.id] || []),
                    })}
                    disabled={syncMutation.isPending}
                    className="btn-primary"
                  >
                    {syncMutation.isPending ? 'Saving…' : 'Save Permissions'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}