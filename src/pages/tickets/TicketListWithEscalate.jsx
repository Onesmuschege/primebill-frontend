import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTickets, escalateTicket } from '../../api/tickets.api'
import { formatDateTime } from '../../utils/formatDate'
import { AlertCircle, ArrowUp } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

export default function TicketList() {
  const [filterStatus, setFilterStatus] = useState('')
  const queryClient = useQueryClient()

  const { data: ticketsData, isLoading } = useQuery({
    queryKey: ['tickets', filterStatus],
    queryFn: () => getTickets({ status: filterStatus }),
  })

  const tickets = Array.isArray(ticketsData?.data) ? ticketsData.data
    : ticketsData?.data?.data || []

  const escalateMutation = useMutation({
    mutationFn: escalateTicket,
    onSuccess: () => {
      toast.success('Ticket escalated!')
      queryClient.invalidateQueries(['tickets'])
    },
    onError: () => toast.error('Failed to escalate ticket'),
  })

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      solved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
    }
    return colors[status] || colors.open
  }

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input"
        >
          <option value="">All Tickets</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="solved">Solved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--pb-text-3)' }}>
          <p className="font-medium" style={{ color: 'var(--pb-text-2)' }}>No tickets found</p>
        </div>
      ) : (
        <div className="card p-0 divide-y overflow-hidden" style={{ borderColor: 'var(--pb-border)' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} className="flex items-center justify-between px-4 py-3 hover:[background-color:var(--pb-raised)]">
              <div className="flex-1">
                <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>#{ticket.id} — {ticket.subject}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>
                  {ticket.client?.first_name} {ticket.client?.last_name} • {formatDateTime(ticket.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${getStatusColor(ticket.status)}`}>
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
                {ticket.status !== 'closed' && ticket.priority !== 'critical' && (
                  <button
                    onClick={() => escalateMutation.mutate(ticket.id)}
                    className="p-1.5 rounded hover:bg-orange-50 dark:hover:bg-orange-900/30"
                    title="Escalate ticket"
                    disabled={escalateMutation.isPending}
                  >
                    <ArrowUp size={16} className="text-orange-600" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
