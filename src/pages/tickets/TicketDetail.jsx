import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTicket, replyTicket, closeTicket, escalateTicket } from '../../api/tickets.api'
import { formatDateTime } from '../../utils/formatDate'
import { ArrowLeft, Send, X, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

export default function TicketDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const qc          = useQueryClient()
  const [message, setMessage] = useState('')

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
        queryFn: () => getTicket(id),
  })

  const replyMutation = useMutation({
    mutationFn: (data) => replyTicket(id, data),
    onSuccess: () => { toast.success('Reply sent!'); setMessage(''); qc.invalidateQueries(['ticket', id]) },
    onError: () => toast.error('Failed to send reply'),
  })

  const closeMutation = useMutation({
    mutationFn: () => closeTicket(id),
    onSuccess: () => { toast.success('Ticket closed'); qc.invalidateQueries(['ticket', id]) },
    onError: () => toast.error('Failed to close ticket'),
  })

  const escalateMutation = useMutation({
    mutationFn: () => escalateTicket(id),
    onSuccess: () => { toast.success('Ticket escalated'); qc.invalidateQueries(['ticket', id]) },
    onError: () => toast.error('Failed to escalate'),
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate('/tickets')}
        className="flex items-center gap-2 text-sm transition-colors"
        style={{ color: 'var(--pb-text-2)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--pb-text-1)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--pb-text-2)'}>
        <ArrowLeft size={16} /> Back to Tickets
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">#{ticket?.id} — {ticket?.subject}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
              {ticket?.client?.first_name} {ticket?.client?.last_name} · {formatDateTime(ticket?.created_at)}
            </p>
          </div>
          {ticket?.status !== 'closed' && (
            <div className="flex items-center gap-2">
              <button onClick={() => escalateMutation.mutate()}
                disabled={escalateMutation.isPending}
                className="btn-secondary flex items-center gap-1 text-sm"
                style={{ color: '#f59e0b', borderColor: 'rgba(245,158,11,0.3)' }}>
                <AlertTriangle size={14} /> Escalate
              </button>
              <button onClick={() => closeMutation.mutate()}
                disabled={closeMutation.isPending}
                className="btn-secondary flex items-center gap-1 text-sm">
                <X size={14} /> Close
              </button>
            </div>
          )}
        </div>

        <div className="rounded-lg p-4" style={{ background: 'var(--pb-raised)' }}>
          <p>{ticket?.description}</p>
        </div>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        {ticket?.replies?.map(reply => (
          <div key={reply.id} className={`card ${reply.is_internal
            ? 'border-yellow-500/20' : ''}`}
            style={reply.is_internal ? { background: 'rgba(245,158,11,0.05)' } : {}}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{reply.user?.name || 'Staff'}</p>
              <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{formatDateTime(reply.created_at)}</p>
            </div>
            <p className="text-sm">{reply.message}</p>
          </div>
        ))}
      </div>

      {/* Reply box */}
      {ticket?.status !== 'closed' && (
        <div className="card">
          <h3 className="font-medium mb-3">Add Reply</h3>
          <textarea value={message} onChange={e => setMessage(e.target.value)}
            rows={4} className="input resize-none mb-3" placeholder="Type your reply…" />
          <div className="flex justify-end">
            <button onClick={() => replyMutation.mutate({ message })}
              disabled={!message || replyMutation.isPending}
              className="btn-primary flex items-center gap-2">
              <Send size={15} />
              {replyMutation.isPending ? 'Sending…' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}