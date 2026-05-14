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
    // Unwrap once: r.data = { data: [...], meta: {...} }
    queryFn: () => getClients({ page, search, status, per_page: 15 }).then(r => r.data),
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
    { key: 'name',       label: 'Client',  render: (r) => `${r.first_name} ${r.last_name}` },
    { key: 'phone',      label: 'Phone' },
    { key: 'email',      label: 'Email',   render: (r) => r.email || '—' },
    { key: 'town',       label: 'Town',    render: (r) => r.town || '—' },
    { key: 'status',     label: 'Status',  render: (r) => (
      <span className={clientStatusBadge(r.status)}>{r.status}</span>
    )},
    { key: 'created_at', label: 'Joined',  render: (r) => formatDate(r.created_at) },
    { key: 'actions',    label: 'Actions', render: (r) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(`/clients/${r.id}`)}
          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
          title="View"
        >
          <Eye size={16} />
        </button>
        {r.status === 'active' ? (
          <button
            onClick={() => suspendMutation.mutate(r.id)}
            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            title="Suspend"
          >
            <UserX size={16} />
          </button>
        ) : (
          <button
            onClick={() => activateMutation.mutate(r.id)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="Activate"
          >
            <UserCheck size={16} />
          </button>
        )}
        <button
          onClick={() => { if (confirm('Delete this client?')) deleteMutation.mutate(r.id) }}
          className="p-1 text-red-600 hover:bg-red-50 rounded"
          title="Delete"
        >
          <Trash2 size={16} />
        </button>
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search clients..."
              className="pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Client
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* Add Client Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Add New Client" size="lg">
        <ClientForm onSuccess={() => {
          setShowForm(false)
          queryClient.invalidateQueries(['clients'])
          toast.success('Client created successfully!')
        }} />
      </Modal>
    </div>
  )
}