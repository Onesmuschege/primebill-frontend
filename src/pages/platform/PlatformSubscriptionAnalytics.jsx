import { useQuery } from '@tanstack/react-query'
import { getSubscriptionStats, getPlatformSubscriptions } from '../../api/platform.api'
import StatCard from '../../components/dashboard/StatCard'
import Spinner from '../../components/common/Spinner'
import { formatKES, formatNumber } from '../../utils/formatCurrency'
import {
  DollarSign,
  TrendingUp,
  Users,
  CreditCard,
  Activity,
} from 'lucide-react'

export default function PlatformSubscriptionAnalytics() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-subscription-stats'],
    queryFn: () => getSubscriptionStats(),
    refetchInterval: 60000,
  })

  const { data: subs, isLoading: subsLoading } = useQuery({
    queryKey: ['platform-subscriptions-analytics'],
    queryFn: () => getPlatformSubscriptions(),
    refetchInterval: 60000,
  })

  const isLoading = statsLoading || subsLoading

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  const recentSubs = Array.isArray(subs?.data) ? subs.data : []
  const s = stats || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Subscription Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
          Revenue metrics and subscription trends across all tenants.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="MRR"
          value={formatKES(s.mrr ?? 0)}
          subtitle={`ARR ${formatKES(s.arr ?? 0)}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Active Subscriptions"
          value={formatNumber(s.active_subscriptions ?? 0)}
          subtitle={`${formatNumber(s.trial_subscriptions ?? 0)} in trial`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Past Due"
          value={formatNumber(s.past_due_subscriptions ?? 0)}
          subtitle={`${formatNumber(s.suspended_subscriptions ?? 0)} suspended`}
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          title="Cancelled"
          value={formatNumber(s.cancelled_subscriptions ?? 0)}
          subtitle={`${formatNumber(s.total_subscriptions ?? 0)} total`}
          icon={Activity}
          color="purple"
        />
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--pb-border)' }}>
          <h3 className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>Recent Subscriptions</h3>
        </div>
        {recentSubs.length === 0 ? (
          <div className="py-12 text-center text-sm" style={{ color: 'var(--pb-text-3)' }}>
            No subscriptions yet.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="text-xs uppercase tracking-wider" style={{ color: 'var(--pb-text-3)', backgroundColor: 'var(--pb-raised)' }}>
              <tr>
                <th className="px-6 py-3">Tenant</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Price</th>
                <th className="px-6 py-3">Cycle</th>
                <th className="px-6 py-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--pb-border)' }}>
              {recentSubs.slice(0, 20).map(sub => (
                <tr key={sub.id} className="hover:bg-black/5 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
                      {sub.tenant?.name ?? `#${sub.tenant_id}`}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm capitalize" style={{ color: 'var(--pb-text-2)' }}>
                    {sub.plan?.name ?? sub.name}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
                      style={{
                        color: sub.status === 'active' ? '#059669' : sub.status === 'trial' ? '#2563eb' : '#94a3b8',
                        background: sub.status === 'active' ? '#dcfce7' : sub.status === 'trial' ? '#dbeafe' : '#f1f5f9',
                      }}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-right font-medium" style={{ color: 'var(--pb-text-1)' }}>
                    {formatKES(sub.price)}
                  </td>
                  <td className="px-6 py-3 text-sm capitalize" style={{ color: 'var(--pb-text-3)' }}>
                    {sub.billing_cycle}
                  </td>
                  <td className="px-6 py-3 text-xs" style={{ color: 'var(--pb-text-3)' }}>
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '—'}
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

function AlertCircle({ size = 20, className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}