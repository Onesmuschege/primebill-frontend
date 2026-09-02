import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getReportData, exportReport } from '../../api/reports.api'
import { formatKES } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import Spinner from '../../components/common/Spinner'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Download, TrendingUp, Users, FileText, MessageSquare, DollarSign, Package } from 'lucide-react'
import toast from 'react-hot-toast'

const REPORT_TYPES = [
  { key: 'income',      label: 'Income',      icon: TrendingUp },
  { key: 'clients',     label: 'Clients',     icon: Users },
  { key: 'invoices',    label: 'Invoices',    icon: FileText },
  { key: 'sms',         label: 'SMS',         icon: MessageSquare },
  { key: 'expenditure', label: 'Expenditure', icon: DollarSign },
  { key: 'inventory',   label: 'Inventory',   icon: Package },
]

// ── Shared style helpers (mirrors the --pb-* tokens used across the app) ────
const thBg = { backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-3)' }
const tdStyle = { color: 'var(--pb-text-2)', borderBottom: '1px solid var(--pb-border)' }
const mutedText = { color: 'var(--pb-text-3)' }
const chartCursor = { fill: 'rgba(37,99,235,0.08)' }

function StatCard({ label, value, color }) {
  return (
    <div className="card text-center">
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-sm mt-1" style={mutedText}>{label}</p>
    </div>
  )
}

function ReportTable({ headers, rows, renderRow, emptyMessage = 'No records found.' }) {
  return (
    <div className="card p-0 overflow-hidden">
      <table className="table w-full text-sm">
        <thead><tr>
          {headers.map(h => <th key={h} style={thBg}>{h}</th>)}
        </tr></thead>
        <tbody>
          {!rows?.length && (
            <tr><td colSpan={headers.length} className="px-4 py-10 text-center" style={mutedText}>{emptyMessage}</td></tr>
          )}
          {rows?.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  )
}

// ── Sub-renderers per report type ────────────────────────────────────────────

function IncomeReport({ data }) {
  const daily = data?.daily || []
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Income" value={formatKES(data?.total)} color="#60a5fa" />
        <StatCard label="M-Pesa"       value={formatKES(data?.by_method?.mpesa)} color="#34d399" />
        <StatCard label="Cash"         value={formatKES(data?.by_method?.cash)}  color="#60a5fa" />
      </div>
      {daily.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Daily Income</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pb-border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatKES(v)} cursor={chartCursor}
                contentStyle={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--pb-text-2)' }} />
              <Area type="monotone" dataKey="total" stroke="#34d399" fill="url(#incomeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {data?.payments?.length > 0 && (
        <ReportTable
          headers={['Client', 'Amount', 'Method', 'Reference', 'Date']}
          rows={data.payments}
          renderRow={(p, i) => (
            <tr key={i}>
              <td className="px-4 py-3" style={tdStyle}>{p.client_name || '—'}</td>
              <td className="px-4 py-3 font-medium" style={{ ...tdStyle, color: '#60a5fa' }}>{formatKES(p.amount)}</td>
              <td className="px-4 py-3 uppercase text-xs" style={tdStyle}>{p.method}</td>
              <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{p.reference || '—'}</td>
              <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{formatDate(p.created_at)}</td>
            </tr>
          )}
        />
      )}
    </div>
  )
}

function ClientsReport({ data }) {
  const monthly = data?.monthly || []
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total"     value={data?.total || 0}     color="var(--pb-text-1)" />
        <StatCard label="Active"    value={data?.active || 0}    color="#34d399" />
        <StatCard label="Suspended" value={data?.suspended || 0} color="#fbbf24" />
        <StatCard label="New"       value={data?.new || 0}       color="#60a5fa" />
      </div>
      {monthly.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>New Clients per Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--pb-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--pb-text-3)' }} />
              <Tooltip cursor={chartCursor}
                contentStyle={{ backgroundColor: 'var(--pb-surface)', border: '1px solid var(--pb-border)', borderRadius: 8 }}
                labelStyle={{ color: 'var(--pb-text-2)' }} />
              <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

function InvoicesReport({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total"   value={data?.total || 0}   color="var(--pb-text-1)" />
        <StatCard label="Paid"    value={data?.paid || 0}    color="#34d399" />
        <StatCard label="Unpaid"  value={data?.unpaid || 0}  color="#fbbf24" />
        <StatCard label="Overdue" value={data?.overdue || 0} color="#f87171" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm" style={mutedText}>Total Invoiced</p>
          <p className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{formatKES(data?.total_amount)}</p>
        </div>
        <div className="card">
          <p className="text-sm" style={mutedText}>Total Collected</p>
          <p className="text-2xl font-bold" style={{ color: '#34d399' }}>{formatKES(data?.paid_amount)}</p>
        </div>
      </div>
    </div>
  )
}

function SmsReport({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Sent" value={data?.total || 0}     color="var(--pb-text-1)" />
        <StatCard label="Delivered"  value={data?.delivered || 0} color="#34d399" />
        <StatCard label="Failed"     value={data?.failed || 0}    color="#f87171" />
      </div>
      {data?.logs?.length > 0 && (
        <ReportTable
          headers={['Recipient', 'Message', 'Status', 'Date']}
          rows={data.logs}
          renderRow={(s, i) => (
            <tr key={i}>
              <td className="px-4 py-3 font-mono text-xs" style={tdStyle}>{s.phone}</td>
              <td className="px-4 py-3 max-w-xs truncate" style={tdStyle}>{s.message}</td>
              <td className="px-4 py-3" style={tdStyle}>
                <span className={s.status === 'delivered' ? 'badge badge-active' : 'badge badge-suspended'}>{s.status}</span>
              </td>
              <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{formatDate(s.created_at)}</td>
            </tr>
          )}
        />
      )}
    </div>
  )
}

function ExpenditureReport({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm" style={mutedText}>Total Expenditure</p>
          <p className="text-2xl font-bold" style={{ color: '#f87171' }}>{formatKES(data?.total)}</p>
        </div>
        <div className="card">
          <p className="text-sm" style={mutedText}>Transactions</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{data?.count || 0}</p>
        </div>
      </div>
      {data?.items?.length > 0 && (
        <ReportTable
          headers={['Description', 'Category', 'Amount', 'Date']}
          rows={data.items}
          renderRow={(e, i) => (
            <tr key={i}>
              <td className="px-4 py-3 font-medium" style={tdStyle}>{e.description}</td>
              <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{e.category || '—'}</td>
              <td className="px-4 py-3 font-medium" style={{ ...tdStyle, color: '#f87171' }}>{formatKES(e.amount)}</td>
              <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{formatDate(e.date)}</td>
            </tr>
          )}
        />
      )}
    </div>
  )
}

function InventoryReport({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Items" value={data?.total || 0}     color="var(--pb-text-1)" />
        <StatCard label="Low Stock"   value={data?.low_stock || 0} color="#f87171" />
        <StatCard label="Assigned"    value={data?.assigned || 0}  color="#60a5fa" />
      </div>
      {data?.items?.length > 0 && (
        <ReportTable
          headers={['Item', 'Category', 'Qty', 'Unit Cost', 'Status']}
          rows={data.items}
          renderRow={(item, i) => (
            <tr key={i}>
              <td className="px-4 py-3 font-medium" style={tdStyle}>{item.name}</td>
              <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{item.category}</td>
              <td className="px-4 py-3 font-medium" style={{ ...tdStyle, color: item.quantity <= item.low_stock_alert ? '#f87171' : 'var(--pb-text-2)' }}>
                {item.quantity}
              </td>
              <td className="px-4 py-3" style={tdStyle}>{formatKES(item.unit_cost)}</td>
              <td className="px-4 py-3" style={tdStyle}>
                <span className={item.status === 'available' ? 'badge badge-active' : 'badge badge-info'}>{item.status}</span>
              </td>
            </tr>
          )}
        />
      )}
    </div>
  )
}

const RENDERERS = {
  income:      IncomeReport,
  clients:     ClientsReport,
  invoices:    InvoicesReport,
  sms:         SmsReport,
  expenditure: ExpenditureReport,
  inventory:   InventoryReport,
}

// ── Main Reports Page ─────────────────────────────────────────────────────────

export default function Reports() {
  const [type, setType] = useState('income')
  const [from, setFrom] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [to, setTo]     = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading } = useQuery({
    queryKey: ['report', type, from, to],
    queryFn: () => getReportData(type, { from, to }),
    enabled: !!from && !!to,
  })

  const handleExport = async () => {
    try {
      const res = await exportReport(type, { from, to })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = `${type}-report-${from}-to-${to}.csv`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  const ReportRenderer = RENDERERS[type]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card flex items-center gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {REPORT_TYPES.map(({ key, label, icon: Icon }) => ( // eslint-disable-line no-unused-vars
            <button
              key={key}
              onClick={() => setType(key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={type === key
                ? { backgroundColor: '#2563eb', color: '#fff' }
                : { backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input text-sm py-1.5 w-36"
          />
          <span style={mutedText}>to</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input text-sm py-1.5 w-36"
          />
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center gap-1.5 text-sm py-1.5"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="py-20"><Spinner size="lg" /></div>
      ) : data ? (
        <ReportRenderer data={data} />
      ) : (
        <div className="card text-center py-16" style={mutedText}>
          No data found for the selected date range.
        </div>
      )}
    </div>
  )
}