import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../../api/admin.api'
import Modal from '../../components/common/Modal'
import { Plus, Trash2, Pencil, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  role_id: '',
}

export default function AdminUsers() {
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const queryClient = useQueryClient()

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAdminUsers(),
  })

  const users = Array.isArray(usersData?.data) ? usersData.data
    : usersData?.data?.data || []

  const openAdd = () => {
    setEditUser(null); setForm(EMPTY_FORM); setErrors({}); setShowForm(true)
  }

  const openEdit = (user) => {
    setEditUser(user)
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role_id: user.roles?.[0]?.id || '',
    })
    setErrors({})
    setShowForm(true)
  }

  const handleChange = (key, val) => {
    setForm(f => ({ ...f, [key]: val }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const saveMutation = useMutation({
    mutationFn: (payload) => editUser
      ? updateAdminUser(editUser.id, payload)
      : createAdminUser(payload),
    onSuccess: () => {
      toast.success(editUser ? 'User updated!' : 'User created!')
      setShowForm(false)
      queryClient.invalidateQueries(['admin-users'])
    },
    onError: (err) => {
      const body = err.response?.data
      if (body?.errors) {
        const mapped = {}
        Object.entries(body.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
        setErrors(mapped)
      }
      toast.error(body?.message || 'Failed to save user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success('User deleted!')
      queryClient.invalidateQueries(['admin-users'])
    },
    onError: () => toast.error('Failed to delete user'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!editUser && !payload.password) {
      setErrors({ password: 'Password is required' })
      return
    }
    if (!payload.password) delete payload.password
    saveMutation.mutate(payload)
  }

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
          {users.length} user{users.length !== 1 ? 's' : ''}
        </p>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      {users.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--pb-text-3)' }}>
          <p className="font-medium" style={{ color: 'var(--pb-text-2)' }}>No admin users</p>
        </div>
      ) : (
        <div className="card p-0 divide-y overflow-hidden" style={{ borderColor: 'var(--pb-border)' }}>
          {users.map(user => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:[background-color:var(--pb-raised)]">
              <div className="flex-1">
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{user.name}</p>
                <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>{user.email}</p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {user.roles?.map(role => (
                  <span key={role.id} className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                    <Shield size={12} />
                    {role.name}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-1 ml-2">
                <button onClick={() => openEdit(user)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30" title="Edit">
                  <Pencil size={14} className="text-blue-600" />
                </button>
                <button onClick={() => { if (confirm('Delete this user?')) deleteMutation.mutate(user.id) }} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete">
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={editUser ? 'Edit User' : 'Add New User'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">Name <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`input w-full ${errors.name ? 'border-red-500' : ''}`}
              required
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="form-label">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`input w-full ${errors.email ? 'border-red-500' : ''}`}
              required
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="form-label">{editUser ? 'New Password (leave blank to keep current)' : 'Password'} {!editUser && <span className="text-red-500">*</span>}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`input w-full ${errors.password ? 'border-red-500' : ''}`}
              required={!editUser}
            />
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary min-w-[100px]">
              {saveMutation.isPending ? 'Saving...' : editUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
