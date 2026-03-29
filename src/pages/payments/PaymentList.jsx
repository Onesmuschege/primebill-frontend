import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPayments, getPaymentSummary } from '../../api/payments.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import { formatKES } from '../../utils/formatCurrency'
import { formatDateTime } from '../../utils/formatDate'
import { DollarSign, Smartphone, Banknote } from 'lucide-react'

export default function PaymentList() {
  const [page, setPage]     = useState(1)
  const [method, setMethod] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, method],
    queryFn: () => getPayments({ page, method, per_page: 15 }).then(r => r.data.data),
  })

  const { data: summary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => getPaymentSummary().then(r => r.data.data),
  })

  const columns = [
    { key: 'client',     label: 'Client',    render: (r) => `${r.client?.first_name} ${r.client?.last_name}` },
    { key: 'amount',     label: 'Amount',    render: (r) => <span className="font-semibold text-primary-600">{formatKES(r.amount)}</span> },
    { key: 'method',     label: 'Method',    render: (r) => (
      <span className={`badge-${r.method === 'mpesa' ? 'active' : 'inactive'}`}>{r.method.toUpperCase()}</span>
    )},
    { key: 'mpesa_code', label: 'Reference', render: (r) => r.mpesa_code || r.reference || '—' },
    { key: 'created_at', label: 'Date',      render: (r) => formatDateTime(r.created_at) },
  ]

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-primary-50 rounded-xl text-primary-600"><DollarSign size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Today's Total</p>
            <p className="text-xl font-bold">{formatKES(summary?.total)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-xl text-green-600"><Smartphone size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">M-Pesa</p>
            <p className="text-xl font-bold">{formatKES(summary?.mpesa)}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Banknote size={22} /></div>
          <div>
            <p className="text-sm text-gray-500">Cash</p>
            <p className="text-xl font-bold">{formatKES(summary?.cash)}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center justify-between">
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); setPage(1) }}
          className="text-sm border rounded-lg px-3 py-2"
        >
          <option value="">All Methods</option>
          <option value="mpesa">M-Pesa</option>
          <option value="cash">Cash</option>
          <option value="bank">Bank</option>
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>
    </div>
  )
}