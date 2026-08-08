import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  getNocOverview,
  getNocDevices,
  getNocAlerts,
} from '../../api/noc.api'
import Spinner from '../../components/common/Spinner'
import {
  Server, Activity, AlertTriangle, ArrowUpRight,
  Wifi, WifiOff, Cpu, MemoryStick,
} from 'lucide-react'

const ALERT_TYPE_LABELS = {
  device_offline: 'Device Offline',
  interface_down: 'Interface Down',
  high_cpu:       'High CPU',
  high_ram:       'High RAM',
  high_latency:   'High Latency',
  high_util:      'High Utilization',
  health_failure: 'Health Failure',
}

export default function NocDashboard() {
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['noc-overview'],
    queryFn: () => getNocOverview().then(r => r.data.data),
  })

  const { data: devices, isLoading: loadingDevices } = useQuery({
    queryKey: ['noc-devices'],
    queryFn: () => getNocDevices({ per_page: 8 }).then(r => r.data.data),
  })

  const { data: alerts, isLoading: loadingAlerts } = useQuery({
    queryKey: ['noc-alerts'],
    queryFn: () => getNocAlerts({ per_page: 6, status: 'open' }).then(r => r.data.data),
  })

  if (loadingOverview || loadingDevices || loadingAlerts) {
    return <div className="py-20"><Spinner size="lg" /></div>
  }

  const stats = [
    { label: 'Total Devices', value: overview?.total_devices ?? 0, icon: Server, color: 'text-blue-600 bg-blue-50' },
    { label: 'Online', value: overview?.online_devices ?? 0, icon: Wifi, color: 'text-green-600 bg-green-50' },
    { label: 'Offline', value: overview?.offline_devices ?? 0, icon: WifiOff, color: 'text-red-600 bg-red-50' },
    { label: 'Open Alerts', value: overview?.open_alerts ?? 0, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
    { label: 'Critical Alerts', value: overview?.critical_alerts ?? 0, icon: Activity, color: 'text-red-600 bg-red-50' },
    { label: 'Health', value: `${overview?.device_health ?? 0}%`, icon: MemoryStick, color: 'text-indigo-600 bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Network Operations Center</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
            Device health, alerts, and topology at a glance
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/noc/alerts" className="btn-secondary flex items-center gap-2">
            <AlertTriangle size={15} /> Alerts
          </Link>
          <Link to="/noc/links" className="btn-primary flex items-center gap-2">
            <Activity size={15} /> Topology
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${color}`}>
                <Icon size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Devices */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Server size={16} className="text-blue-600" /> Devices
            </h2>
            <Link to="/noc/devices" className="text-sm flex items-center gap-1 text-blue-600 hover:underline">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {devices?.data?.length === 0 && (
              <p className="text-sm text-gray-500">No devices registered yet.</p>
            )}
            {devices?.data?.map(device => (
              <div key={device.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${device.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {device.status === 'online' ? <Wifi size={16} /> : <WifiOff size={16} />}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{device.name}</p>
                    <p className="text-xs text-gray-500">
                      {device.ip_address} · {device.device_type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {device.open_alerts_count > 0 && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                      {device.open_alerts_count} alert{device.open_alerts_count > 1 ? 's' : ''}
                    </span>
                  )}
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${device.status === 'online' ? 'badge-active' : 'badge-suspended'}`}>
                    {device.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" /> Active Alerts
            </h2>
            <Link to="/noc/alerts" className="text-sm flex items-center gap-1 text-blue-600 hover:underline">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          <div className="space-y-3">
            {alerts?.data?.length === 0 && (
              <p className="text-sm text-gray-500">No active alerts. All systems nominal.</p>
            )}
            {alerts?.data?.map(alert => (
              <div key={alert.id} className="flex items-start justify-between p-3 rounded-lg border">
                <div>
                  <p className="font-medium text-sm">{ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{alert.device?.name}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                  alert.severity === 'critical' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
