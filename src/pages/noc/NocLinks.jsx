import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNocLinks, createNocLink, deleteNocLink, getNocDevices } from '../../api/noc.api'
import { unwrapList } from '../../api/axiosInstance'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'
import { Plus, Trash2, Activity } from 'lucide-react'

const MEDIA_STYLES = {
  fiber:    'bg-orange-50 text-orange-600',
  copper:   'bg-yellow-50 text-yellow-600',
  wireless: 'bg-purple-50 text-purple-600',
}

const STATUS_STYLES = {
  up:       'badge-active',
  down:     'badge-suspended',
  degraded: 'bg-amber-50 text-amber-600',
}

export default function NocLinks() {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    device_a_id: '', device_b_id: '', interface_a: '', interface_b: '',
    media: 'fiber', status: 'up', description: '',
  })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['noc-links'],
    queryFn: () => getNocLinks({ per_page: 25 }).then(unwrapList),
  })

  const { data: devices } = useQuery({
    queryKey: ['noc-devices-all'],
        queryFn: () => getNocDevices({ per_page: 100 }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: createNocLink,
    onSuccess: () => { toast.success('Link created'); setShowForm(false); queryClient.invalidateQueries(['noc-links']) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteNocLink,
    onSuccess: () => { toast.success('Link deleted'); queryClient.invalidateQueries(['noc-links']) },
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Network Topology</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
            Physical and logical links between devices
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Link
        </button>
      </div>

      <div className="card overflow-hidden">
        {data?.data?.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <Activity size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No network links defined.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b" style={{ background: 'var(--pb-raised)' }}>
                <th className="px-4 py-3">Device A</th>
                <th className="px-4 py-3">Device B</th>
                <th className="px-4 py-3">Interfaces</th>
                <th className="px-4 py-3">Media</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map(link => (
                <tr key={link.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{link.device_a?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium">{link.device_b?.name || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {link.interface_a || '—'} ↔ {link.interface_b || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${MEDIA_STYLES[link.media] || ''}`}>
                      {link.media}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[link.status] || 'badge-active'}`}>
                      {link.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => deleteMutation.mutate(link.id)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                        title="Delete link"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add Network Link">
        <form
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form) }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device A</label>
              <select
                value={form.device_a_id}
                onChange={(e) => setForm({ ...form, device_a_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select device</option>
                {devices?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device B</label>
              <select
                value={form.device_b_id}
                onChange={(e) => setForm({ ...form, device_b_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select device</option>
                {devices?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interface A</label>
              <input
                value={form.interface_a}
                onChange={(e) => setForm({ ...form, interface_a: e.target.value })}
                className="input"
                placeholder="ether1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Interface B</label>
              <input
                value={form.interface_b}
                onChange={(e) => setForm({ ...form, interface_b: e.target.value })}
                className="input"
                placeholder="ether1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media</label>
              <select
                value={form.media}
                onChange={(e) => setForm({ ...form, media: e.target.value })}
                className="input"
              >
                <option value="fiber">Fiber</option>
                <option value="copper">Copper</option>
                <option value="wireless">Wireless</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="input"
              >
                <option value="up">Up</option>
                <option value="down">Down</option>
                <option value="degraded">Degraded</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input"
              placeholder="Link description"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Saving...' : 'Add Link'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
