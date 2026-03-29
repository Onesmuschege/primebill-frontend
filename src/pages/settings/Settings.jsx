import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../api/axiosInstance'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company')
  const [form, setForm] = useState({})

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => {
      const flat = {}
      Object.values(r.data.data).forEach(group => Object.assign(flat, group))
      setForm(flat)
      return r.data.data
    }),
  })

  const updateMutation = useMutation({
    mutationFn: (data) => api.put('/settings', { settings: data }),
    onSuccess: () => toast.success('Settings saved!'),
    onError: () => toast.error('Failed to save settings'),
  })

  const tabs = [
    { key: 'company', label: 'Company' },
    { key: 'billing', label: 'Billing' },
    { key: 'mpesa',   label: 'M-Pesa' },
    { key: 'sms',     label: 'SMS' },
    { key: 'system',  label: 'System' },
  ]

  const groupFields = {
    company: ['company_name', 'company_phone', 'company_email', 'company_address', 'company_paybill'],
    billing: ['invoice_prefix', 'tax_rate', 'grace_period', 'currency'],
    mpesa:   ['mpesa_env', 'mpesa_consumer_key', 'mpesa_consumer_secret', 'mpesa_shortcode', 'mpesa_passkey'],
    sms:     ['sms_gateway', 'sms_api_key', 'sms_sender_id'],
    system:  ['timezone', 'date_format'],
  }

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  return (
    <div className="flex gap-6">
      {/* Sidebar Tabs */}
      <div className="w-48 shrink-0">
        <div className="card p-2">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 card">
        <h3 className="font-semibold text-lg mb-6 capitalize">{activeTab} Settings</h3>
        <div className="space-y-4">
          {groupFields[activeTab]?.map(key => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              <input
                value={form[key] || ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="input"
                type={key.includes('secret') || key.includes('key') || key.includes('passkey') ? 'password' : 'text'}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isPending}
            className="btn-primary"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}