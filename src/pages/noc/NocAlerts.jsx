import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNocAlerts, acknowledgeNocAlert, resolveNocAlert } from '../../api/noc.api'
import { unwrapList } from '../../api/axiosInstance'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'
import { AlertTriangle, CheckCircle2, Eye, RefreshCw } from 'lucide-react'

const ALERT_TYPE_LABELS = {
  device_offline: 'Device Offline',
  interface_down: 'Interface Down',
  high_cpu:       'High CPU',
  high_ram:       'High RAM',
  high_latency:   'High Latency',
  high_util:      'High Utilization',
  health_failure: 'Health Failure',
}

const SEVERITY_STYLES = {
  info:     'bg-blue-50 text-blue-600',
  warning:  'bg-amber-50 text-amber-600',
  critical: 'bg-red-50 text-red-600',
}

const STATUS_STYLES = {
  open:          'badge-active',
  acknowledged:  'bg-blue-50 text-blue-600',
  resolved:      'badge-resolved bg-green-50 text-green-600',
}

export default function NocAlerts() {
  const [status, setStatus] = useState('open')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['noc-alerts', status],
    queryFn: () => getNocAlerts({ status, per_page: 25 }).then(unwrapList),
  })

  const acknowledgeMutation = useMutation({
    mutationFn: acknowledgeNocAlert,
    onSuccess: () => { toast.success('Alert acknowledged'); queryClient.invalidateQueries(['noc-alerts']) },
  })

  const resolveMutation = useMutation({
    mutationFn: resolveNocAlert,
    onSuccess: () => { toast.success('Alert resolved'); queryClient.invalidateQueries(['noc-alerts']) },
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Network Alerts</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
            Monitor and manage device alert lifecycle
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border p-1">
          {['open', 'acknowledged', 'resolved'].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                status === s ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {data?.data?.length === 0 ? (
          <div className="p-10 text-center text-gray-500">
            <AlertTriangle size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No {status} alerts.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b" style={{ background: 'var(--pb-raised)' }}>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map(alert => (
                <tr key={alert.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                  </td>
                  <td className="px-4 py-3">{alert.device?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[280px] truncate">{alert.message}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.warning}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_STYLES[alert.status] || 'badge-active'}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(alert.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {alert.status === 'open' && (
                        <button
                          onClick={() => acknowledgeMutation.mutate(alert.id)}
                          disabled={acknowledgeMutation.isPending}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50"
                          title="Acknowledge"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => resolveMutation.mutate(alert.id)}
                          disabled={resolveMutation.isPending}
                          className="p-1.5 rounded-lg text-green-600 hover:bg-green-50"
                          title="Resolve"
                        >
                          <CheckCircle2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
