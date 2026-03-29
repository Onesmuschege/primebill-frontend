import { useQuery } from '@tanstack/react-query'
import { getDashboardStats, getTopDownloaders, getTrafficData } from '../../api/dashboard.api'
import StatCard from '../../components/dashboard/StatCard'
import { formatKES } from '../../utils/formatCurrency'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, DollarSign, Wifi, Ticket, Activity } from 'lucide-react'
import Spinner from '../../components/common/Spinner'

export default function Dashboard() {
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => getDashboardStats().then(r => r.data.data),
    refetchInterval: 30000,
  })

  const { data: traffic } = useQuery({
    queryKey: ['dashboard-traffic'],
    queryFn: () => getTrafficData('day').then(r => r.data.data),
    refetchInterval: 60000,
  })

  const { data: downloaders } = useQuery({
    queryKey: ['top-downloaders'],
    queryFn: () => getTopDownloaders().then(r => r.data.data),
  })

  if (statsLoading) return <div className="py-20"><Spinner size="lg" /></div>

  const stats = statsData

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Income Today"
          value={formatKES(stats?.income_today?.amount)}
          subtitle={`${stats?.income_today?.count} payments`}
          icon={DollarSign}
          color="primary"
        />
        <StatCard
          title="Income This Month"
          value={formatKES(stats?.income_month?.amount)}
          subtitle={`${stats?.income_month?.count} payments`}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats?.active_users || 0}
          subtitle={`of ${stats?.total_users} total`}
          icon={Wifi}
          color="primary"
        />
        <StatCard
          title="Total Clients"
          value={stats?.total_users || 0}
          subtitle={`${stats?.account_status?.overdue} overdue`}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Tickets & Account Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Ticket size={18} />
            Tickets
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Open',    value: stats?.tickets?.open,    color: 'text-red-600' },
              { label: 'Pending', value: stats?.tickets?.pending, color: 'text-yellow-600' },
              { label: 'Solved',  value: stats?.tickets?.solved,  color: 'text-green-600' },
              { label: 'Total',   value: stats?.tickets?.total,   color: 'text-gray-600' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className={`text-2xl font-bold ${color}`}>{value || 0}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity size={18} />
            Account Status
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Online',  value: stats?.account_status?.online,  color: 'bg-green-500' },
              { label: 'Offline', value: stats?.account_status?.offline, color: 'bg-gray-400' },
              { label: 'Overdue', value: stats?.account_status?.overdue, color: 'bg-red-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  <span className="text-sm text-gray-600">{label}</span>
                </div>
                <span className="font-semibold">{value || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-700 mb-4">SMS Stats</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Sent Today</span>
              <span className="font-semibold text-green-600">{stats?.sms_stats?.sent_today || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Failed</span>
              <span className="font-semibold text-red-600">{stats?.sms_stats?.failed || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Traffic Chart */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Daily Network Traffic</h3>
        {traffic && traffic.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={traffic[0]?.traffic || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="tx_mbps" stroke="#16a34a" fill="#dcfce7" name="Upload Mbps" />
              <Area type="monotone" dataKey="rx_mbps" stroke="#2563eb" fill="#dbeafe" name="Download Mbps" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-60 flex items-center justify-center text-gray-400">
            No traffic data available — connect a router to see live data
          </div>
        )}
      </div>

      {/* Top Downloaders */}
      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Top Downloaders</h3>
        {downloaders && downloaders.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">#</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Username</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Client</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Downloaded</th>
                <th className="px-4 py-2 text-left text-xs text-gray-500 uppercase">Uploaded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {downloaders.map((d, i) => (
                <tr key={i}>
                  <td className="px-4 py-2 text-gray-500">{i + 1}</td>
                  <td className="px-4 py-2 font-medium">{d.username}</td>
                  <td className="px-4 py-2">{d.client}</td>
                  <td className="px-4 py-2 text-blue-600">{d.downloaded}</td>
                  <td className="px-4 py-2 text-green-600">{d.uploaded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-400 text-center py-8">No active sessions</p>
        )}
      </div>
    </div>
  )
}