import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTicket, replyTicket, closeTicket } from '../../api/tickets.api'
import { formatDateTime } from '../../utils/formatDate'
import { ArrowLeft, Send, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

export default function TicketDetail() {
  const { id }          = useParams()
  const navigate        = useNavigate()
  const queryClient     = useQueryClient()
  const [message, setMessage] = useState('')

  const { data: ticket, isLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => getTicket(id).then(r => r.data.data),
  })

  const replyMutation = useMutation({
    mutationFn: (data) => replyTicket(id, data),
    onSuccess: () => {
      toast.success('Reply sent!')
      setMessage('')
      queryClient.invalidateQueries(['ticket', id])
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => closeTicket(id),
    onSuccess: () => {
      toast.success('Ticket closed')
      queryClient.invalidateQueries(['ticket', id])
    },
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate('/tickets')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft size={18} /> Back to Tickets
      </button>

      <div className="card">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">#{ticket?.id} — {ticket?.subject}</h2>
            <p className="text-sm text-gray-500">
              {ticket?.client?.first_name} {ticket?.client?.last_name} • {formatDateTime(ticket?.created_at)}
            </p>
          </div>
          {ticket?.status !== 'closed' && (
            <button onClick={() => closeMutation.mutate()} className="btn-secondary flex items-center gap-1 text-sm">
              <X size={14} /> Close
            </button>
          )}
        </div>
        <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{ticket?.description}</p>
      </div>

      {/* Replies */}
      <div className="space-y-3">
        {ticket?.replies?.map(reply => (
          <div
            key={reply.id}
            className={`card ${reply.is_internal ? 'border-yellow-200 bg-yellow-50' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">{reply.user?.name || 'Staff'}</p>
              <p className="text-xs text-gray-400">{formatDateTime(reply.created_at)}</p>
            </div>
            <p className="text-gray-700 text-sm">{reply.message}</p>
          </div>
        ))}
      </div>

      {/* Reply Box */}
      {ticket?.status !== 'closed' && (
        <div className="card">
          <h3 className="font-medium mb-3">Add Reply</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="input resize-none mb-3"
            placeholder="Type your reply..."
          />
          <div className="flex justify-end">
            <button
              onClick={() => replyMutation.mutate({ message })}
              disabled={!message || replyMutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Send size={16} />
              {replyMutation.isPending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}