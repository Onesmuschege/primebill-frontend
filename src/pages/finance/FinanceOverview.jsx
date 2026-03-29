import { useQuery } from '@tanstack/react-query'
import api from '../../api/axiosInstance'
import { formatKES } from '../../utils/formatCurrency'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'
import Spinner from '../../components/common/Spinner'

export default function FinanceOverview() {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['finance-summary'],
    queryFn: () => api.get('/expenditures/summary').then(r => r.data.data),
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Income',       value: summary?.income,      icon: TrendingUp,   color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Expenditure',  value: summary?.expenditure, icon: TrendingDown, color: 'text-red-600',    bg: 'bg-red-50' },
          { label: 'Net Revenue',  value: summary?.net_revenue, icon: DollarSign,   color: 'text-primary-600',bg: 'bg-primary-50' },
          { label: 'Receivables',  value: summary?.receivables, icon: AlertCircle,  color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}><Icon size={22} /></div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className={`text-xl font-bold ${color}`}>{formatKES(value)}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-sm text-gray-400 text-center">Showing data for {summary?.month}</p>
    </div>
  )
}