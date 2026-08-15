import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTickets, updateTicket, closeTicket } from '../../api/tickets.api'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'

const COLUMNS = ['new', 'open', 'in_progress', 'waiting', 'resolved', 'closed']
const variant = { new: 'inactive', open: 'info', in_progress: 'pending', waiting: 'overdue', resolved: 'active', closed: 'suspended' }

function Card({ ticket, onChange }) {
  return (
    <div className="rounded border p-2 text-sm" style={{ backgroundColor: 'var(--pb-surface)', borderColor: 'var(--pb-border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium" style={{ color: 'var(--pb-text-1)' }}>#{ticket.id} {ticket.subject}</div>
          <div className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{ticket.assigned_to?.name || 'Unassigned'}</div>
        </div>
        <Badge label={ticket.status} variant={variant[ticket.status] || 'inactive'} />
      </div>
      <select className="input text-xs mt-1 w-full" value={ticket.status} onChange={(e) => onChange(e.target.value)}>
        {COLUMNS.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
      </select>
    </div>
  )
}

export default function TicketBoard() {
  const qc = useQueryClient()
  const list = useQuery({
    queryKey: ['tickets-board'],
    queryFn: async () => {
      const res = await getTickets({ per_page: 200 })
      return res?.data?.data?.data ?? res?.data?.data ?? []
    },
    staleTime: 60_000,
  })
  const items = list.data || []
  const mutate = useMutation({
    mutationFn: ({ id, status }) => (status === 'closed' ? closeTicket(id) : updateTicket(id, { status })),
    onSuccess: () => { toast.success('Ticket updated'); qc.invalidateQueries(['tickets-board']) },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  })
  if (list.isLoading) return <Spinner />
  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Tickets Board</h1>
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Kanban view of support tickets by status.</p>
        </div>
        <Badge label={`${items.length} tickets`} variant="info" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {COLUMNS.map((st) => (
          <div key={st} className="rounded-lg border p-2" style={{ backgroundColor: 'var(--pb-raised)', borderColor: 'var(--pb-border)' }}>
            <div className="px-2 py-1 font-semibold text-xs uppercase" style={{ color: 'var(--pb-text-3)' }}>{st.replace('_', ' ')}</div>
            <div className="space-y-2 min-h-[60px]">
              {items.filter((t) => t.status === st).map((t) => (
                <Card key={t.id} ticket={t} onChange={(status) => mutate.mutate({ id: t.id, status })} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
