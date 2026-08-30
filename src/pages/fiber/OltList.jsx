import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  getOlts, createOlt, deleteOlt, testOltConnection,
} from '../../api/fiber.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import toast from 'react-hot-toast'
import {
  Plus, Wrench, Trash2, Activity,
} from 'lucide-react'

const VENDOR_BADGES = {
  huawei:    'bg-red-50 text-red-600',
  zte:       'bg-blue-50 text-blue-600',
  fiberhome: 'bg-green-50 text-green-600',
  vsol:      'bg-purple-50 text-purple-600',
  other:     'bg-gray-50 text-gray-600',
}

const STATUS_STYLES = {
  online:      'badge-active',
  offline:     'badge-suspended',
  maintenance: 'bg-amber-50 text-amber-600',
}

const EMPTY_FORM = {
  name: '', vendor: 'huawei', model: '', ip_address: '',
  username: '', password: '', status: 'online', location: '',
}

export default function OltList() {
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['olts', page],
        queryFn: () => getOlts({ page, per_page: 15 }),
  })

  const createMutation = useMutation({
    mutationFn: createOlt,
    onSuccess: () => {
      toast.success('OLT created')
      setShowModal(false)
      setForm(EMPTY_FORM)
      queryClient.invalidateQueries(['olts'])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to create OLT'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOlt,
    onSuccess: () => { toast.success('OLT deleted'); queryClient.invalidateQueries(['olts']) },
  })

  const testMutation = useMutation({
    mutationFn: testOltConnection,
    onSuccess: () => toast.success('Connection successful'),
    onError: () => toast.error('Connection failed'),
  })

  const submit = (e) => {
    e.preventDefault()
    createMutation.mutate(form)
  }

  const columns = [
    { key: 'name', label: 'Name', render: (olt) => (
      <Link to={`/fiber/olts/${olt.id}`} className="font-medium text-blue-600 hover:underline">
        {olt.name}
      </Link>
    )},
    { key: 'vendor', label: 'Vendor', render: (olt) => (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full uppercase ${VENDOR_BADGES[olt.vendor] || VENDOR_BADGES.other}`}>
        {olt.vendor}
      </span>
    )},
    { key: 'model', label: 'Model', render: (olt) => <span className="text-sm text-gray-600">{olt.model || '—'}</span> },
    { key: 'ip_address', label: 'IP Address', render: (olt) => (
      <span className="font-mono text-xs text-gray-500">{olt.ip_address}</span>
    )},
    { key: 'pon_ports_count', label: 'PON Ports', render: (olt) => <span className="text-sm">{olt.pon_ports_count ?? 0}</span> },
    { key: 'onts_count', label: 'ONTs', render: (olt) => <span className="text-sm">{olt.onts_count ?? 0}</span> },
    { key: 'status', label: 'Status', render: (olt) => (
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[olt.status] || 'badge-active'}`}>
        {olt.status}
      </span>
    )},
    { key: 'actions', label: '', render: (olt) => (
      <div className="flex justify-end gap-1">
        <button
          onClick={() => testMutation.mutate(olt.id)}
          disabled={testMutation.isPending}
          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
          title="Test Connection"
        >
          <Activity size={15} />
        </button>
        <Link to={`/fiber/olts/${olt.id}`} className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50" title="View">
          <Wrench size={15} />
        </Link>
        <button
          onClick={() => {
            if (confirm(`Delete OLT "${olt.name}"?`)) deleteMutation.mutate(olt.id)
          }}
          className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
          title="Delete"
        >
          <Trash2 size={15} />
        </button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Fiber / OLT</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
            Manage OLT devices, PON ports, and ONTs
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/fiber/map" className="btn-secondary flex items-center gap-2">
            <Wrench size={15} /> Infrastructure
          </Link>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add OLT
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {showModal && (
        <Modal title="Add OLT" onClose={() => setShowModal(false)}>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Vendor *</label>
                <select className="input" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })}>
                  <option value="huawei">Huawei</option>
                  <option value="zte">ZTE</option>
                  <option value="fiberhome">FiberHome</option>
                  <option value="vsol">VSOL</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Model</label>
                <input className="input" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="e.g. MA5608T" />
              </div>
            </div>
            <div>
              <label className="label">IP Address *</label>
              <input className="input" value={form.ip_address} onChange={(e) => setForm({ ...form, ip_address: e.target.value })} required placeholder="192.168.1.4" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Username</label>
                <input className="input" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create OLT'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
