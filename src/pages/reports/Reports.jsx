import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../api/axiosInstance'
import { formatKES } from '../../utils/formatCurrency'
import Spinner from '../../components/common/Spinner'

export default function Reports() {
  const [type, setType]   = useState('income')
  const [from, setFrom]   = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0])
  const [to, setTo]       = useState(new Date().toISOString().split('T')[0])

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['report', type, from, to],
    queryFn: () => api.get(`/reports/${type}`, { params: { from, to } }).then(r => r.data.data),
    enabled: !!from && !!to,
  })

  const reportTypes = [
    { key: 'income',      label: 'Income' },
    { key: 'clients',     label: 'Clients' },
    { key: 'invoices',    label: 'Invoices' },
    { key: 'sms',         label: 'SMS' },
    { key: 'expenditure', label: 'Expenditure' },
    { key: 'inventory',   label: 'Inventory' },
  ]

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card flex items-center gap-4 flex-wrap">
        <div className="flex gap-2">
          {reportTypes.map(r => (
            <button
              key={r.key}
              onClick={() => setType(r.key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                type === r.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="input text-sm py-1.5 w-36" />
          <span className="text-gray-400">to</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="input text-sm py-1.5 w-36" />
        </div>
      </div>

      {/* Report Content */}
      {isLoading ? (
        <div className="py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="card">
          <pre className="text-sm text-gray-700 overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}