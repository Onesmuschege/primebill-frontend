import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getClients, deleteClient, suspendClient, activateClient } from '../../api/clients.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { clientStatusBadge } from '../../utils/statusColors'
import { formatDate } from '../../utils/formatDate'
import { Plus, Search, Eye, UserX, UserCheck, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import ClientForm from './ClientForm'

export default function ClientList() {
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [showForm, setShowForm] = useState(false)
  const navigate                = useNavigate()
  const queryClient             = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['clients', page, search, status],
    queryFn: () => getClients({ page, search, status, per_page: 15 }),
  })

  const suspendMutation = useMutation({
    mutationFn: suspendClient,
    onSuccess: () => { toast.success('Client suspended'); queryClient.invalidateQueries(['clients']) },
    onError: () => toast.error('Failed to suspend client'),
  })

  const activateMutation = useMutation({
    mutationFn: activateClient,
    onSuccess: () => { toast.success('Client activated'); queryClient.invalidateQueries(['clients']) },
    onError: () => toast.error('Failed to activate client'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: () => { toast.success('Client deleted'); queryClient.invalidateQueries(['clients']) },
    onError: () => toast.error('Failed to delete client'),
  })

  const columns = [
    { key: 'name',       label: 'Client',  render: (r) => (
      <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
        {r.first_name} {r.last_name}
      </span>
    )},
    { key: 'phone',      label: 'Phone',   render: (r) => <span style={{ color: 'var(--pb-text-2)' }}>{r.phone}</span> },
    { key: 'email',      label: 'Email',   render: (r) => <span style={{ color: 'var(--pb-text-2)' }}>{r.email || '—'}</span> },
    { key: 'town',       label: 'Town',    render: (r) => <span style={{ color: 'var(--pb-text-2)' }}>{r.town || '—'}</span> },
    { key: 'status',     label: 'Status',  render: (r) => (
      <span className={clientStatusBadge(r.status)}>{r.status}</span>
    )},
    { key: 'created_at', label: 'Joined',  render: (r) => (
      <span style={{ color: 'var(--pb-text-3)' }}>{formatDate(r.created_at)}</span>
    )},
    { key: 'actions',    label: '',        render: (r) => (
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate(`/clients/${r.id}`)}
          className="p-1.5 rounded-lg transition-colors"
          title="View"
          style={{ color: '#60a5fa' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.1)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Eye size={15} />
        </button>
        {r.status === 'active' ? (
          <button
            onClick={() => suspendMutation.mutate(r.id)}
            className="p-1.5 rounded-lg transition-colors"
            title="Suspend"
            style={{ color: '#fbbf24' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(245,158,11,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <UserX size={15} />
          </button>
        ) : (
          <button
            onClick={() => activateMutation.mutate(r.id)}
            className="p-1.5 rounded-lg transition-colors"
            title="Activate"
            style={{ color: '#34d399' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.1)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <UserCheck size={15} />
          </button>
        )}
        <button
          onClick={() => { if (confirm('Delete this client?')) deleteMutation.mutate(r.id) }}
          className="p-1.5 rounded-lg transition-colors"
          title="Delete"
          style={{ color: '#f87171' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Trash2 size={15} />
        </button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--pb-text-3)' }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search clients..."
              className="input pl-9 w-56"
            />
          </div>
          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="input w-auto"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <Plus size={15} /> Add Client
        </button>
      </div>

      {/* Table card */}
      <div className="section">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* Add Client Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Client" size="lg">
        <ClientForm onSuccess={() => {
          setShowForm(false)
          queryClient.invalidateQueries(['clients'])
        }} />
      </Modal>
    </div>
  )
}