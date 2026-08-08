import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getNocDevices } from '../../api/noc.api'
import Spinner from '../../components/common/Spinner'
import { Server, Wifi, WifiOff, Cpu, Activity } from 'lucide-react'

const DEVICE_TYPE_LABELS = {
  router: 'Router',
  switch: 'Switch',
  ap:     'Access Point',
  olt:    'OLT',
  other:  'Other',
}

export default function NocDevices() {
  const [deviceType, setDeviceType] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['noc-devices', deviceType, status],
    queryFn: () => getNocDevices({ device_type: deviceType || undefined, status: status || undefined, per_page: 25 }).then(r => r.data),
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Network Devices</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-3)' }}>
            Routers, switches, access points, and OLTs
          </p>
        </div>
        <div className="flex gap-2">
          <select value={deviceType} onChange={(e) => setDeviceType(e.target.value)} className="input !w-auto">
            <option value="">All types</option>
            {Object.entries(DEVICE_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input !w-auto">
            <option value="">All status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.data?.length === 0 && (
          <div className="col-span-full p-10 text-center text-gray-500">
            <Server size={32} className="mx-auto mb-2 text-gray-300" />
            <p>No devices found.</p>
          </div>
        )}
        {data?.data?.map(device => (
          <div key={device.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-lg ${device.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                  {device.status === 'online' ? <Wifi size={20} /> : <WifiOff size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold">{device.name}</h3>
                  <p className="text-sm text-gray-500">{device.ip_address}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${device.status === 'online' ? 'badge-active' : 'badge-suspended'}`}>
                {device.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5">
                <Server size={13} /> {DEVICE_TYPE_LABELS[device.device_type] || device.device_type}
              </div>
              <div className="flex items-center gap-1.5">
                <Cpu size={13} /> {device.model || '—'}
              </div>
              <div className="flex items-center gap-1.5">
                <Activity size={13} /> {device.vendor || '—'}
              </div>
            </div>

            {device.open_alerts_count > 0 && (
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-600">
                  {device.open_alerts_count} open alert{device.open_alerts_count > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
