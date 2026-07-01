import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getClients } from '../../api/clients.api'
import { getFupLogs, getFupStatus, resetFupLog, getFupStats } from '../../api/fup.api'
import Spinner from '../../components/common/Spinner'
import { RotateCcw, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function FupManagement() {
  const [selectedAccount, setSelectedAccount] = useState(null)
  const queryClient = useQueryClient()

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(),
  })

  const { data: statsData } = useQuery({
    queryKey: ['fup-stats'],
    queryFn: () => getFupStats(),
  })

  const { data: fupStatusData, isLoading: statusLoading } = useQuery({
    queryKey: ['fup-status', selectedAccount?.id],
    queryFn: () => selectedAccount ? getFupStatus(selectedAccount.id) : null,
    enabled: !!selectedAccount,
  })

  const resetMutation = useMutation({
    mutationFn: (accountId) => resetFupLog(accountId),
    onSuccess: () => {
      toast.success('FUP reset successfully!')
      queryClient.invalidateQueries(['fup-status'])
      queryClient.invalidateQueries(['fup-stats'])
    },
    onError: () => toast.error('Failed to reset FUP'),
  })

  const clients = Array.isArray(clientsData?.data) ? clientsData.data
    : clientsData?.data?.data || []
  const stats = statsData?.data?.data || {}
  const fupStatus = fupStatusData?.data?.data || {}

  const accountsWithFup = clients.flatMap(c => c.accounts?.filter(a => a.plan?.fup_limit) || [])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--pb-text-3)' }}>Accounts with FUP</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-primary-600)' }}>{stats.accounts_with_fup || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--pb-text-3)' }}>Triggered</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--color-warning-600)' }}>{stats.triggered_count || 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium" style={{ color: 'var(--pb-text-3)' }}>Usage Rate</p>
          <p className="text-2xl font-bold mt-1" style={{ color: 'var(--pb-text-1)' }}>{stats.percentage || 0}%</p>
        </div>
      </div>

      {/* Account Selector and Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="font-semibold px-4 py-3" style={{ borderBottom: '1px solid var(--pb-border)' }}>Accounts with FUP</h3>
            <div className="overflow-y-auto max-h-96 divide-y">
              {accountsWithFup.length === 0 ? (
                <p className="text-xs p-4" style={{ color: 'var(--pb-text-3)' }}>No accounts with FUP</p>
              ) : (
                accountsWithFup.map(account => (
                  <button
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className="w-full text-left px-4 py-3 hover:[background-color:var(--pb-raised)] transition-colors"
                    style={{
                      backgroundColor: selectedAccount?.id === account.id ? 'var(--pb-raised)' : 'transparent',
                    }}
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{account.username}</p>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{account.client?.first_name} {account.client?.last_name}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Status Details */}
        <div className="lg:col-span-2">
          {!selectedAccount ? (
            <div className="card text-center py-12" style={{ color: 'var(--pb-text-3)' }}>
              <p>Select an account to view FUP details</p>
            </div>
          ) : statusLoading ? (
            <div className="py-12"><Spinner size="lg" /></div>
          ) : !fupStatus.enabled ? (
            <div className="card flex items-start gap-3 p-4">
              <AlertCircle size={16} className="text-yellow-600 mt-1 shrink-0" />
              <div>
                <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>No FUP Configured</p>
                <p className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>{fupStatus.message}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header */}
              <div className="card p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--pb-text-3)' }}>Account</p>
                    <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{selectedAccount.username}</p>
                  </div>
                  <button
                    onClick={() => resetMutation.mutate(selectedAccount.id)}
                    disabled={resetMutation.isPending}
                    className="btn-secondary flex items-center gap-1 text-sm"
                  >
                    <RotateCcw size={14} />
                    {resetMutation.isPending ? 'Resetting...' : 'Reset'}
                  </button>
                </div>
              </div>

              {/* FUP Details */}
              <div className="card p-4 space-y-3">
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--pb-text-3)' }}>FUP Limit</p>
                  <p className="text-lg font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                    {fupStatus.limit_gb?.toFixed(1)} GB
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium" style={{ color: 'var(--pb-text-3)' }}>Usage</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                      {fupStatus.percentage}%
                    </p>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        fupStatus.percentage > 80 ? 'bg-red-500' :
                        fupStatus.percentage > 60 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(fupStatus.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--pb-text-3)' }}>
                    {formatBytes(fupStatus.bytes_used)} used of {formatBytes(fupStatus.bytes_used + fupStatus.bytes_remaining)}
                  </p>
                </div>

                {fupStatus.triggered && (
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">🔻 FUP Triggered</p>
                    <p className="text-xs mt-1 text-yellow-700 dark:text-yellow-400">
                      Speed throttled to {fupStatus.throttled_down / 1024} Mbps
                    </p>
                    <p className="text-xs mt-1 text-yellow-700 dark:text-yellow-400">
                      Triggered: {new Date(fupStatus.triggered_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
