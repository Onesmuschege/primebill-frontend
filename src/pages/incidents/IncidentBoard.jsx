import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getIncidents, updateIncidentStatus, acknowledgeIncident, closeIncident } from '../../api/incidents.api'
import Badge from '../../components/common/Badge'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'

const COLUMNS = ['detected', 'acknowledged', 'investigating', 'mitigating', 'resolved', 'closed']
const variant = { detected: 'inactive', acknowledged: 'pending', investigating: 'info', mitigating: 'overdue', resolved: 'active', closed: 'suspended' }

export default function IncidentBoard() {
  const qc = useQueryClient()
  const list = useQuery({
    queryKey: ['incidents-board'],
    queryFn: async () => {
      const res = await getIncidents({ per_page: 200 })
      return res?.data?.data?.data ?? res?.data?.data ?? []
    },
    staleTime: 60_000,
  })
  const items = list.data || []

  const mutate = useMutation({
    mutationFn: ({ id, status, ack, close }) => {
      if (close) return closeIncident(id)
      if (ack) return acknowledgeIncident(id)
      return updateIncidentStatus(id, status)
    },
    onSuccess: () => { toast.success('Incident updated'); qc.invalidateQueries(['incidents-board']) },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  })

  if (list.isLoading) return <Spinner />
  const group = (st) => items.filter((i) => i.status === st)

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents Board</h1>
          <p className="text-sm text-gray-500">NOC outage triage Kanban — detect, acknowledge, mitigate, resolve.</p>
        </div>
        <Badge label={`${items.length} incidents`} variant="info" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {COLUMNS.map((st) => (
          <div key={st} className="bg-gray-50 rounded-lg border border-gray-200 p-2">
            <div className="px-2 py-1 font-semibold text-xs uppercase" style={{ color: 'var(--pb-text-3)' }}>{st}</div>
            <div className="space-y-2 min-h-[60px]">
              {group(st).map((i) => (
                <Card key={i.id} item={i} onChange={(payload) => mutate.mutate({ id: i.id, ...payload })} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Card({ item, onChange }) {
  return (
    <div className="bg-white rounded border border-gray-200 p-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">#{item.id} {item.title}</div>
        <Badge label={item.severity} variant={variant[item.severity] || 'inactive'} />
      </div>
      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
      <div className="flex gap-1 mt-1">
        {item.status !== 'acknowledged' && <button onClick={() => onChange({ ack: true })} className="px-1.5 py-0.5 text-[10px] rounded text-white bg-blue-600">Ack</button>}
        {item.status !== 'closed' && <button onClick={() => onChange({ close: true })} className="px-1.5 py-0.5 text-[10px] rounded text-white bg-red-600">Close</button>}
      </div>
      <select className="input text-xs mt-1 w-full" value={item.status} onChange={(e) => onChange({ status: e.target.value })}>
        {COLUMNS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}