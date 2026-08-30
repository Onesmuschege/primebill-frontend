import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getRadiusSettings, testRadiusConnection } from '../../api/radius.api'
import { Activity, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

export default function RadiusTab() {
  const [testResult, setTestResult] = useState(null)

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['radius-settings'],
    queryFn: () => getRadiusSettings(),
  })

  const testMutation = useMutation({
    mutationFn: testRadiusConnection,
    onSuccess: (res) => {
      setTestResult(res.result)
      toast.success(res.message || 'RADIUS test passed')
    },
    onError: (err) => {
      setTestResult({ success: false, message: err.response?.data?.message })
      toast.error('RADIUS test failed')
    },
  })

  const settings = settingsData || {}

  if (isLoading) return <div className="py-8"><Spinner size="md" /></div>

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="form-label">RADIUS Driver</label>
          <p className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>
            {settings.radius_driver || 'mock'}
          </p>
        </div>
        <div>
          <label className="form-label">Connection</label>
          <p className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>
            {settings.radius_connection || 'radius'}
          </p>
        </div>
      </div>

      <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--pb-border)' }}>
        <h4 className="font-medium mb-3">Connection Test</h4>
        <button
          onClick={() => testMutation.mutate()}
          disabled={testMutation.isPending}
          className="btn-primary"
        >
          {testMutation.isPending ? 'Testing...' : 'Test Connection'}
        </button>

        {testResult && (
          <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
            testResult.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <Activity size={16} className={`mt-1 shrink-0 ${
              testResult.success ? 'text-green-600' : 'text-red-600'
            }`} />
            <div>
              <p className={`text-sm font-medium ${
                testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
              }`}>
                {testResult.success ? '✓ Connected' : '✗ Connection Failed'}
              </p>
              <p className={`text-xs mt-1 ${
                testResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                {testResult.message}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
