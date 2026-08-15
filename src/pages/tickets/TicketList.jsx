import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getTickets, getTicketStats, createTicket, escalateTicket } from '../../api/tickets.api'
import { getClients } from '../../api/clients.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import { ticketPriorityColor, ticketStatusBadge } from '../../utils/statusColors'
import { formatDateTime } from '../../utils/formatDate'
import { Eye, Plus, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

const emptyTicket = {
  client_id: '',
  subject: '',
  description: '',
  priority: 'normal',
}

export default function TicketList() {
  const [page, setPage]       = useState(1)
  const [status, setStatus]   = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]       = useState(emptyTicket)
  const navigate              = useNavigate()
  const queryClient           = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, status],
    queryFn: () => getTickets({ page, status }).then(r => r.data.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => getTicketStats().then(r => r.data.data),
  })

  // NOTE: getClients() already calls unwrapList() internally and resolves to
  // { data: [], meta: {} } — NOT a raw axios response — so only one .data
  // unwrap is needed here (see the same fix in InvoiceList.jsx).
  const { data: clientsData } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => getClients({ per_page: 200 }).then(r => r.data),
    enabled: showCreate,
  })

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      toast.success('Ticket created!')
      setShowCreate(false)
      setForm(emptyTicket)
      queryClient.invalidateQueries(['tickets'])
      queryClient.invalidateQueries(['ticket-stats'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create ticket'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.client_id) return toast.error('Please select a client')
    createMutation.mutate(form)
  }

    const escalateMutation = useMutation({
    mutationFn: (id) => escalateTicket(id),
    onSuccess: () => {
      toast.success('Ticket escalated')
      queryClient.invalidateQueries(['tickets'])
    },
    onError: () => toast.error('Failed to escalate'),
  })

  const columns = [
    { key: 'id',         label: '#',        render: (r) => `#${r.id}` },
    { key: 'subject',    label: 'Subject',  render: (r) => <span className="font-medium">{r.subject}</span> },
    { key: 'client',     label: 'Client',   render: (r) => `${r.client?.first_name} ${r.client?.last_name}` },
    { key: 'priority',   label: 'Priority', render: (r) => (
      <span className={ticketPriorityColor(r.priority)}>{r.priority}</span>
    )},
    { key: 'status',     label: 'Status',   render: (r) => (
      <span className={ticketStatusBadge(r.status)}>{r.status}</span>
    )},
    { key: 'created_at', label: 'Created',  render: (r) => formatDateTime(r.created_at) },
    { key: 'actions',    label: '',         render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={() => navigate(`/tickets/${r.id}`)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="View">
          <Eye size={16} />
        </button>
        {r.status !== 'closed' && (
          <button
            onClick={() => escalateMutation.mutate(r.id)}
            className="p-1 text-orange-600 hover:bg-orange-50 rounded"
            title="Escalate"
            disabled={escalateMutation.isPending}
          >
            <AlertTriangle size={15} />
          </button>
        )}
      </div>
    )},
  ]

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Open',    value: stats?.open,    color: 'text-red-600' },
          { label: 'Pending', value: stats?.pending, color: 'text-yellow-600' },
          { label: 'Solved',  value: stats?.solved,  color: 'text-green-600' },
          { label: 'Total',   value: stats?.total,   color: 'text-gray-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-3xl font-bold ${color}`}>{value || 0}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters + Create */}
      <div className="flex items-center justify-between">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="text-sm border rounded-lg px-3 py-2"
        >
          <option value="">All Tickets</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="solved">Solved</option>
          <option value="closed">Closed</option>
        </select>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* Create Ticket Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Ticket" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select
              value={form.client_id}
              onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a client...</option>
              {clientsData?.data?.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} — {c.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="input"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="input"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="input resize-none"
              rows={4}
              placeholder="Detailed description of the issue..."
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}