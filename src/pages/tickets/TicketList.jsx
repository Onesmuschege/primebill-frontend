import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getTickets, getTicketStats } from '../../api/tickets.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { ticketPriorityColor } from '../../utils/statusColors'
import { formatDateTime } from '../../utils/formatDate'
import { Eye } from 'lucide-react'

export default function TicketList() {
  const [page, setPage]     = useState(1)
  const [status, setStatus] = useState('')
  const navigate            = useNavigate()

  const { data, isLoading } = useQuery({
    queryKey: ['tickets', page, status],
    queryFn: () => getTickets({ page, status }).then(r => r.data.data),
  })

  const { data: stats } = useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => getTicketStats().then(r => r.data.data),
  })

  const columns = [
    { key: 'id',          label: '#',       render: (r) => `#${r.id}` },
    { key: 'subject',     label: 'Subject',  render: (r) => <span className="font-medium">{r.subject}</span> },
    { key: 'client',      label: 'Client',   render: (r) => `${r.client?.first_name} ${r.client?.last_name}` },
    { key: 'priority',    label: 'Priority', render: (r) => (
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${ticketPriorityColor(r.priority)}`}>
        {r.priority}
      </span>
    )},
    { key: 'status',      label: 'Status',   render: (r) => <span className="badge-inactive">{r.status}</span> },
    { key: 'created_at',  label: 'Created',  render: (r) => formatDateTime(r.created_at) },
    { key: 'actions',     label: '',         render: (r) => (
      <button onClick={() => navigate(`/tickets/${r.id}`)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
        <Eye size={16} />
      </button>
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

      <div className="flex items-center gap-3">
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
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>
    </div>
  )
}