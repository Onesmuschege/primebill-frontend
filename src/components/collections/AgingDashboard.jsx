import { formatKES, formatNumber } from '../../utils/formatCurrency'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import Table from '../common/Table'
import Spinner from '../common/Spinner'

const BAR_COLORS = ['#0ea5e9', '#2563eb', '#60a5fa', '#f59e0b', '#ef4444', '#9966ff', '#10b981']

export default function AgingDashboard({ aging, isLoading }) {
  if (isLoading) {
    return (
      <div className="card p-6 flex justify-center">
        <Spinner size="md" />
      </div>
    )
  }

  const buckets = aging?.buckets ?? []
  const clients = aging?.clients ?? []
  const total = aging?.total_outstanding ?? 0
  const count = aging?.total_invoices ?? 0
  const currency = aging?.currency ?? 'KES'
  const generatedAt = aging?.generated_at

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 stat-accent-blue">
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>
            Outstanding
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--pb-text-1)' }}>
            {formatKES(total)}
          </p>
        </div>
        <div className="card p-5 stat-accent-cyan">
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>
            Overdue invoices
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--pb-text-1)' }}>
            {formatNumber(count)}
          </p>
        </div>
        <div className="card p-5 stat-accent-orange">
          <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--pb-text-3)' }}>
            Currency
          </p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--pb-text-1)' }}>{currency}</p>
          {generatedAt && (
            <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>
              as of {new Date(generatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
        <div className="lg:col-span-3 card p-4 stat-accent-red">
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--pb-text-2)' }}>
            Exposure by age bucket
          </p>
          {buckets.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>
              No overdue invoices right now — good place to be.
            </p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={buckets} barGap={4} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--pb-border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => formatKES(value)}
                    cursor={{ fill: 'rgba(37,99,235,0.08)' }}
                    contentStyle={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)' }}
                    labelStyle={{ color: 'var(--pb-text-1)' }}
                  />
                  <Bar dataKey="outstanding" radius={[4, 4, 0, 0]}>
                    {buckets.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 card p-4 stat-accent-green">
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--pb-text-2)' }}>
            Top exposure by client
          </p>
          {clients.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>
              No client exposure to report.
            </p>
          ) : (
            <Table
              columns={[
                { key: 'client_name', label: 'Client' },
                { key: 'outstanding', label: 'Outstanding', render: (r) => formatKES(r.outstanding) },
                { key: 'invoice_count', label: 'Invoices' },
              ]}
              data={clients}
              emptyMessage="No client exposure"
            />
          )}
        </div>
      </div>
    </div>
  )
}