import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getRouters, createRouter, testRouterConnection } from '../../api/routers.api'
import Modal from '../../components/common/Modal'
import Skeleton from '../../components/common/Skeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import { Plus, Wifi, WifiOff, RefreshCw, Router } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RouterList() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ name: '', ip_address: '', username: 'admin', password: '', port: 8728, type: 'mikrotik', location: '' })
  const queryClient             = useQueryClient()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['routers'],
    queryFn: () => getRouters(),
  })

  const routers = data?.data ?? []

  const createMutation = useMutation({
    mutationFn: createRouter,
    onSuccess: () => { toast.success('Router added!'); setShowForm(false); queryClient.invalidateQueries(['routers']) },
  })

  const testMutation = useMutation({
    mutationFn: testRouterConnection,
    onSuccess: (res) => {
            const connected = res.connected
      toast[connected ? 'success' : 'error'](connected ? 'Router is online!' : 'Cannot connect to router')
      queryClient.invalidateQueries(['routers'])
    },
  })

  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? 'Failed to load routers'}
        onRetry={() => queryClient.invalidateQueries(['routers'])}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Router
        </button>
      </div>

            {routers.length === 0 ? (
        <EmptyState
          icon={Router}
          title="No routers"
          description="Add your first router to start managing network access."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {routers.map(router => (
          <div key={router.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${router.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {router.status === 'online' ? <Wifi size={20} /> : <WifiOff size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold">{router.name}</h3>
                  <p className="text-sm text-gray-500">{router.ip_address}:{router.port}</p>
                  <p className="text-xs text-gray-400">{router.location}</p>
                </div>
              </div>
              <button
                onClick={() => testMutation.mutate(router.id)}
                disabled={testMutation.isPending}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
              >
                <RefreshCw size={16} className={testMutation.isPending ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${
                router.status === 'online' ? 'badge-active' : 'badge-suspended'
              }`}>
                {router.status}
              </span>
              <span className="text-xs text-gray-400">{router.type.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Router">
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }} className="space-y-4">
          {[
            { key: 'name',       label: 'Router Name',  required: true },
            { key: 'ip_address', label: 'IP Address',   required: true },
            { key: 'username',   label: 'Username',     required: true },
            { key: 'password',   label: 'Password',     required: true, type: 'password' },
            { key: 'port',       label: 'API Port',     type: 'number' },
            { key: 'location',   label: 'Location' },
          ].map(({ key, label, required, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type || 'text'}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input"
                required={required}
              />
            </div>
          ))}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving...' : 'Add Router'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}