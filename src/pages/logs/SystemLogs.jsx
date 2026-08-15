import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import logsApi from '../../api/Logs.api'
import { unwrapList } from '../../api/axiosInstance'
import Pagination from '../../components/common/Pagination'
import Spinner from '../../components/common/Spinner'
import { Download, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FILTERS = {
  action: '',
  model: '',
  from: '',
  to: '',
}

export default function SystemLogs() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [exporting, setExporting] = useState(false)

  const params = { page, per_page: 20, ...filters }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['system-logs', params],
    queryFn: () => logsApi.getLogs(params),
    placeholderData: (previousData) => previousData,
  })

  const { data: logs, meta } = data ? unwrapList(data) : { data: [], meta: null }

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await logsApi.exportLogs(filters)
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `system_logs_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleString('en-KE', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
          {meta?.total !== undefined ? `${meta.total} log${meta.total !== 1 ? 's' : ''}` : ''}
          {isFetching && !isLoading && ' · refreshing...'}
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary flex items-center gap-2"
        >
          <Download size={16} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      <div className="card p-4 space-y-3" style={{ borderColor: 'var(--pb-border)' }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2 relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
            <input
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Search action..."
              className="input w-full pl-8"
            />
          </div>
          <input
            value={filters.model}
            onChange={(e) => handleFilterChange('model', e.target.value)}
            placeholder="Model (e.g. Client)"
            className="input w-full"
          />
          <input
            type="date"
            value={filters.from}
            onChange={(e) => handleFilterChange('from', e.target.value)}
            className="input w-full"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => handleFilterChange('to', e.target.value)}
            className="input w-full"
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--pb-text-3)' }}
          >
            <X size={12} /> Clear filters
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="card text-center py-16" style={{ color: 'var(--pb-text-3)' }}>
          <p className="font-medium" style={{ color: 'var(--pb-text-2)' }}>No log entries found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden" style={{ borderColor: 'var(--pb-border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--pb-border)' }}>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--pb-text-3)' }}>User</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--pb-text-3)' }}>Action</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--pb-text-3)' }}>Model</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--pb-text-3)' }}>IP Address</th>
                  <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--pb-text-3)' }}>Date</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--pb-border)' }}>
                {logs.map(log => (
                  <tr key={log.id} className="hover:[background-color:var(--pb-raised)]">
                    <td className="px-4 py-3" style={{ color: 'var(--pb-text-1)' }}>
                      {log.user?.name || 'System'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--pb-text-2)' }}>
                      {log.action}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--pb-text-3)' }}>
                      {log.model ? `${log.model}${log.model_id ? ` #${log.model_id}` : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--pb-text-3)' }}>
                      {log.ip_address || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: 'var(--pb-text-3)' }}>
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={meta} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}