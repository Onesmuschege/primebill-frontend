import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '../../api/axiosInstance'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'
import {
  Eye, EyeOff, Building2, Receipt, Smartphone,
  MessageSquare, Settings as SettingsIcon, Radio, Mail
} from 'lucide-react'

const TABS = [
  { key: 'company', label: 'Company',  icon: Building2 },
  { key: 'billing', label: 'Billing',  icon: Receipt },
  { key: 'mpesa',   label: 'M-Pesa',   icon: Smartphone },
  { key: 'sms',     label: 'SMS',      icon: MessageSquare },
  { key: 'email',   label: 'Email',    icon: Mail },
  { key: 'radius',  label: 'RADIUS',   icon: Radio },
  { key: 'system',  label: 'System',   icon: SettingsIcon },
]

const FIELD_META = {
  company_name:             { label: 'Company Name',          span: 'half' },
  company_phone:            { label: 'Company Phone',         span: 'half', helper: 'Format: +254XXXXXXXXX' },
  company_email:            { label: 'Company Email',         span: 'half' },
  company_paybill:          { label: 'Company Paybill',       span: 'half', helper: 'Safaricom paybill or till number' },
  company_address:          { label: 'Company Address',       span: 'full' },

  invoice_prefix:           { label: 'Invoice Prefix',        span: 'half', helper: 'Prepended to invoice numbers e.g. INV' },
  tax_rate:                 { label: 'Tax Rate (%)',           span: 'half' },
  grace_period:             { label: 'Grace Period (days)',    span: 'half', helper: 'Days before overdue accounts suspend' },
  currency:                 { label: 'Currency',              span: 'half' },

  mpesa_env:                { label: 'Environment',           span: 'half', helper: 'sandbox or production' },
  mpesa_shortcode:          { label: 'Shortcode',             span: 'half' },
  mpesa_consumer_key:       { label: 'Consumer Key',          span: 'half', sensitive: true },
  mpesa_consumer_secret:    { label: 'Consumer Secret',       span: 'half', sensitive: true },
  mpesa_passkey:            { label: 'Passkey',               span: 'full', sensitive: true },

  sms_gateway:              { label: 'SMS Gateway',           span: 'half', helper: 'africas_talking or hostpinnacle' },
  sms_sender_id:            { label: 'Sender ID',             span: 'half', helper: 'Max 11 characters' },
  sms_api_key:              { label: 'API Key',               span: 'full', sensitive: true },

  // Email tab (stored in .env / config, surfaced here as settings keys)
  mail_driver:              { label: 'Mail Driver',           span: 'half', helper: 'smtp, mailgun, log' },
  mail_host:                { label: 'SMTP Host',             span: 'half' },
  mail_port:                { label: 'SMTP Port',             span: 'half', helper: 'Usually 587 (TLS) or 465 (SSL)' },
  mail_username:            { label: 'SMTP Username',         span: 'half' },
  mail_password:            { label: 'SMTP Password',         span: 'half', sensitive: true },
  mail_encryption:          { label: 'Encryption',            span: 'half', helper: 'tls or ssl' },
  mail_from_address:        { label: 'From Address',          span: 'half', helper: 'noreply@yourisp.co.ke' },
  mail_from_name:           { label: 'From Name',             span: 'half' },

  // RADIUS tab
  radius_driver:            { label: 'RADIUS Driver',         span: 'half', helper: 'freeradius or mock' },
  radius_connection:        { label: 'DB Connection Name',    span: 'half', helper: 'Key in config/database.php e.g. radius' },
  radius_host:              { label: 'RADIUS DB Host',        span: 'half' },
  radius_port:              { label: 'RADIUS DB Port',        span: 'half', helper: 'Default: 3306' },
  radius_database:          { label: 'RADIUS DB Name',        span: 'half', helper: 'Usually "radius"' },
  radius_username:          { label: 'RADIUS DB User',        span: 'half' },
  radius_password:          { label: 'RADIUS DB Password',    span: 'half', sensitive: true },

  timezone:                 { label: 'Timezone',              span: 'half', helper: 'e.g. Africa/Nairobi' },
  date_format:              { label: 'Date Format',           span: 'half', helper: 'e.g. d/m/Y' },
}

const GROUP_FIELDS = {
  company: ['company_name','company_phone','company_email','company_paybill','company_address'],
  billing: ['invoice_prefix','tax_rate','grace_period','currency'],
  mpesa:   ['mpesa_env','mpesa_shortcode','mpesa_consumer_key','mpesa_consumer_secret','mpesa_passkey'],
  sms:     ['sms_gateway','sms_sender_id','sms_api_key'],
  email:   ['mail_driver','mail_host','mail_port','mail_username','mail_password','mail_encryption','mail_from_address','mail_from_name'],
  radius:  ['radius_driver','radius_connection','radius_host','radius_port','radius_database','radius_username','radius_password'],
  system:  ['timezone','date_format'],
}

function getMeta(key) {
  return FIELD_META[key] || { label: key.replace(/_/g, ' '), span: 'half' }
}

function SettingField({ fieldKey, value, onChange }) {
  const meta = getMeta(fieldKey)
  const [reveal, setReveal] = useState(false)

  return (
    <div className={meta.span === 'full' ? 'col-span-2' : 'col-span-2 sm:col-span-1'}>
      <label className="block text-sm font-medium mb-1.5 capitalize" style={{ color: 'var(--pb-text-2)' }}>
        {meta.label}
      </label>
      <div className="relative">
        <input
          value={value || ''}
          onChange={e => onChange(fieldKey, e.target.value)}
          className="input"
          type={meta.sensitive && !reveal ? 'password' : 'text'}
          autoComplete={meta.sensitive ? 'new-password' : 'off'}
        />
        {meta.sensitive && (
          <button type="button" onClick={() => setReveal(r => !r)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--pb-text-3)' }}
            aria-label={reveal ? 'Hide' : 'Show'}>
            {reveal ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {meta.helper && <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>{meta.helper}</p>}
    </div>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company')
  const [form, setForm] = useState({})

  const { isLoading } = useQuery({
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
    onSuccess: () => toast.success('Settings saved'),
    onError:   () => toast.error('Failed to save settings'),
  })

  const testSmsMutation = useMutation({
    mutationFn: () => api.post('/settings/test-sms'),
    onSuccess: () => toast.success('Test SMS sent'),
    onError:   () => toast.error('Failed to send test SMS'),
  })

  const testRadiusMutation = useMutation({
    mutationFn: () => api.post('/radius/sync'),
    onSuccess: () => toast.success('RADIUS sync triggered — check system logs'),
    onError:   () => toast.error('RADIUS sync failed'),
  })

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }))

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  const activeLabel = TABS.find(t => t.key === activeTab)?.label

  const isSensitiveTab = activeTab === 'mpesa' || activeTab === 'sms' || activeTab === 'email' || activeTab === 'radius'

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="w-52 shrink-0">
        <div className="card p-2">
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all relative"
                style={isActive ? {
                  background: 'linear-gradient(90deg,rgba(37,99,235,0.16),rgba(37,99,235,0.03))',
                  color: '#2563eb',
                } : { color: 'var(--pb-text-2)' }}>
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r"
                    style={{ background: 'linear-gradient(180deg,#2563eb,#06b6d4)' }} />
                )}
                <Icon size={16} className="shrink-0" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 card">
        <div className="mb-6 pb-4" style={{ borderBottom: '1px solid var(--pb-border)' }}>
          <h3 className="font-semibold text-lg">{activeLabel} Settings</h3>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            {isSensitiveTab
              ? 'Sensitive credentials — click the eye icon to reveal before editing.'
              : `Manage your ${activeLabel?.toLowerCase()} configuration.`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          {GROUP_FIELDS[activeTab]?.map(key => (
            <SettingField key={key} fieldKey={key} value={form[key]} onChange={handleChange} />
          ))}
        </div>

        <div className="flex items-center justify-between mt-8 pt-5"
          style={{ borderTop: '1px solid var(--pb-border)' }}>
          <div className="flex gap-2">
            {activeTab === 'sms' && (
              <button onClick={() => testSmsMutation.mutate()}
                disabled={testSmsMutation.isPending} className="btn-secondary text-sm">
                {testSmsMutation.isPending ? 'Sending…' : 'Send Test SMS'}
              </button>
            )}
            {activeTab === 'radius' && (
              <button onClick={() => testRadiusMutation.mutate()}
                disabled={testRadiusMutation.isPending} className="btn-secondary text-sm">
                {testRadiusMutation.isPending ? 'Syncing…' : 'Test RADIUS Sync'}
              </button>
            )}
          </div>
          <button onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isPending} className="btn-primary">
            {updateMutation.isPending ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}