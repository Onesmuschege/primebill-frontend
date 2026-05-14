import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/axiosInstance'
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

// ── Sub-renderers per report type ────────────────────────────────────────────

function IncomeReport({ data }) {
  const daily = data?.daily || []
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Income',  value: formatKES(data?.total),        color: 'text-primary-600' },
          { label: 'M-Pesa',        value: formatKES(data?.by_method?.mpesa), color: 'text-green-600' },
          { label: 'Cash',          value: formatKES(data?.by_method?.cash),  color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {daily.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">Daily Income</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatKES(v)} />
              <Area type="monotone" dataKey="total" stroke="#16a34a" fill="url(#incomeGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {data?.payments?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Client', 'Amount', 'Method', 'Reference', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.payments.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{p.client_name || '—'}</td>
                  <td className="px-4 py-3 font-medium text-primary-600">{formatKES(p.amount)}</td>
                  <td className="px-4 py-3 uppercase text-xs">{p.method}</td>
                  <td className="px-4 py-3 text-gray-500">{p.reference || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ClientsReport({ data }) {
  const monthly = data?.monthly || []
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total',     value: data?.total,     color: 'text-gray-800' },
          { label: 'Active',    value: data?.active,    color: 'text-green-600' },
          { label: 'Suspended', value: data?.suspended, color: 'text-orange-600' },
          { label: 'New',       value: data?.new,       color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {monthly.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4">New Clients per Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
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
        {[
          { label: 'Total',     value: data?.total,     color: 'text-gray-800' },
          { label: 'Paid',      value: data?.paid,      color: 'text-green-600' },
          { label: 'Unpaid',    value: data?.unpaid,    color: 'text-yellow-600' },
          { label: 'Overdue',   value: data?.overdue,   color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Invoiced</p>
          <p className="text-2xl font-bold text-primary-600">{formatKES(data?.total_amount)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Collected</p>
          <p className="text-2xl font-bold text-green-600">{formatKES(data?.paid_amount)}</p>
        </div>
      </div>
    </div>
  )
}

function SmsReport({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sent',  value: data?.total,   color: 'text-gray-800' },
          { label: 'Delivered',   value: data?.delivered, color: 'text-green-600' },
          { label: 'Failed',      value: data?.failed,  color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {data?.logs?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Recipient', 'Message', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.logs.map((s, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{s.phone}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{s.message}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      s.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ExpenditureReport({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Expenditure</p>
          <p className="text-2xl font-bold text-red-600">{formatKES(data?.total)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Transactions</p>
          <p className="text-2xl font-bold text-gray-800">{data?.count || 0}</p>
        </div>
      </div>
      {data?.items?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Description', 'Category', 'Amount', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((e, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.description}</td>
                  <td className="px-4 py-3 text-gray-500">{e.category || '—'}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">{formatKES(e.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(e.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function InventoryReport({ data }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Items',  value: data?.total,      color: 'text-gray-800' },
          { label: 'Low Stock',    value: data?.low_stock,  color: 'text-red-600' },
          { label: 'Assigned',     value: data?.assigned,   color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value || 0}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
      {data?.items?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Item', 'Category', 'Qty', 'Unit Cost', 'Status'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.map((item, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-gray-500">{item.category}</td>
                  <td className={`px-4 py-3 font-medium ${item.quantity <= item.low_stock_alert ? 'text-red-600' : ''}`}>
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3">{formatKES(item.unit_cost)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>{item.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    queryFn: () => api.get(`/reports/${type}`, { params: { from, to } }).then(r => r.data.data),
    enabled: !!from && !!to,
  })

  const handleExport = async () => {
    try {
      const res = await api.get(`/reports/${type}/export`, {
        params: { from, to },
        responseType: 'blob',
      })
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
          {REPORT_TYPES.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                type === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
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
          <span className="text-gray-400">to</span>
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
        <div className="card text-center text-gray-400 py-16">
          No data found for the selected date range.
        </div>
      )}
    </div>
  )
}