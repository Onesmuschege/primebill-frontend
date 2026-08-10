import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getApiKeys, createApiKey, revokeApiKey,
  getSessions, revokeSession, revokeAllSessions,
  getLoginHistory, getSecurityEvents,
} from '../../api/security.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'keys', label: 'API Keys' },
  { key: 'sessions', label: 'Sessions' },
  { key: 'history', label: 'Login History' },
  { key: 'events', label: 'Security Events' },
]

export default function SecurityCenter() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('keys')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', scopes: '', expires_at: '' })
  const [newKey, setNewKey] = useState(null)

  // api-keys and sessions list endpoints return plain arrays.
  const keys = useQuery({ queryKey: ['api-keys'], queryFn: async () => (await getApiKeys()).data, enabled: tab === 'keys' })
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: async () => (await getSessions()).data.data?.data ?? (await getSessions()).data.data ?? [], enabled: tab === 'sessions' })
  const history = useQuery({ queryKey: ['login-history'], queryFn: async () => (await getLoginHistory()).data, enabled: tab === 'history' })
  const events = useQuery({ queryKey: ['security-events'], queryFn: async () => (await getSecurityEvents()).data, enabled: tab === 'events' })

  const create = useMutation({
    mutationFn: () => createApiKey({ name: form.name, scopes: form.scopes ? form.scopes.split(',').map((s) => s.trim()).filter(Boolean) : [], expires_at: form.expires_at || undefined }),
    onSuccess: (res) => { toast.success('API key created — copy the secret now (shown only once)'); setNewKey(res.data); setModal(false); setForm({ name: '', scopes: '', expires_at: '' }); qc.invalidateQueries(['api-keys']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Create failed'),
  })
  const revoke = useMutation({
    mutationFn: (id) => revokeApiKey(id),
    onSuccess: () => { toast.success('API key revoked'); qc.invalidateQueries(['api-keys']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Revoke failed'),
  })
  const revokeSess = useMutation({
    mutationFn: (id) => revokeSession(id),
    onSuccess: () => { toast.success('Session revoked'); qc.invalidateQueries(['sessions']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Revoke failed'),
  })
  const revokeAll = useMutation({
    mutationFn: () => revokeAllSessions(),
    onSuccess: () => { toast.success('Other sessions revoked'); qc.invalidateQueries(['sessions']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  })

  return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Security Center</h2>
            <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>API keys, active sessions and login activity</p>
          </div>
          {tab === 'keys' && <button onClick={() => setModal(true)} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#2563eb' }}>+ Create API Key</button>}
          {tab === 'sessions' && <button onClick={() => { if (window.confirm('Revoke all other sessions?')) revokeAll.mutate() }} className="px-3 py-2 rounded-lg text-sm font-medium text-red-600" style={{ background: 'rgba(239,68,68,0.1)' }}>Revoke Other Sessions</button>}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'keys' && (
        <div className="card p-0 overflow-hidden">
          <Table
            loading={keys.isLoading}
            data={keys.data || []}
            emptyMessage="No API keys"
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
              { key: 'key_secret', label: 'Secret (masked)', render: (r) => <code className="text-xs">{r.key_secret ? `••••${r.key_secret}` : '—'}</code> },
              { key: 'scopes', label: 'Scopes', render: (r) => (Array.isArray(r.scopes) && r.scopes.length ? r.scopes.join(', ') : '—') },
              { key: 'expires_at', label: 'Expires', render: (r) => r.expires_at ? new Date(r.expires_at).toLocaleDateString() : 'Never' },
              { key: 'actions', label: '', render: (r) => (
                <button onClick={() => { if (window.confirm('Revoke this API key?')) revoke.mutate(r.id) }} className="px-2 py-1 text-xs rounded-md text-white" style={{ background: '#dc2626' }}>Revoke</button>
              ) },
            ]}
          />
        </div>
      )}

      {tab === 'sessions' && (
        <div className="card p-0 overflow-hidden">
          <Table
            loading={sessions.isLoading}
            data={sessions.data || []}
            emptyMessage="No sessions"
            columns={[
              { key: 'name', label: 'Name', render: (r) => <span>{r.name}{r.is_current ? ' ' : ''}{r.is_current && <Badge label="current" variant="active" />}</span> },
              { key: 'last_used_at', label: 'Last used', render: (r) => r.last_used_at ? new Date(r.last_used_at).toLocaleString() : '—' },
              { key: 'created_at', label: 'Created', render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '—' },
              { key: 'actions', label: '', render: (r) => r.is_current ? <span className="text-xs" style={{ color: 'var(--pb-text-3)' }}>Use logout to end</span> : (
                <button onClick={() => { if (window.confirm('Revoke this session?')) revokeSess.mutate(r.id) }} className="px-2 py-1 text-xs rounded-md text-white" style={{ background: '#dc2626' }}>Revoke</button>
              ) },
            ]}
          />
        </div>
      )}

      {tab === 'history' && (
        <div className="card p-0 overflow-hidden">
          <Table
            loading={history.isLoading}
            data={history.data || []}
            emptyMessage="No login history"
            columns={[
              { key: 'login_at', label: 'Time', render: (r) => r.login_at ? new Date(r.login_at).toLocaleString() : (r.created_at ? new Date(r.created_at).toLocaleString() : '—') },
              { key: 'ip_address', label: 'IP Address' },
              { key: 'user_agent', label: 'User Agent', render: (r) => <span className="text-xs break-all">{r.user_agent ? (r.user_agent.length > 40 ? r.user_agent.slice(0, 40) + '…' : r.user_agent) : '—'}</span> },
              { key: 'successful', label: 'Status', render: (r) => r.successful === false ? <Badge label="failed" variant="suspended" /> : <Badge label="success" variant="active" /> },
            ]}
          />
        </div>
      )}

      {tab === 'events' && (
        <div className="card p-0 overflow-hidden">
          <Table
            loading={events.isLoading}
            data={events.data || []}
            emptyMessage="No security events"
            columns={[
              { key: 'created_at', label: 'Time', render: (r) => r.created_at ? new Date(r.created_at).toLocaleString() : '—' },
              { key: 'action', label: 'Event', render: (r) => <Badge label={r.action || r.type} variant="info" /> },
              { key: 'description', label: 'Details', render: (r) => <span className="text-xs">{r.description || r.message || r.ip_address || '—'}</span> },
              { key: 'ip_address', label: 'IP', render: (r) => r.ip_address || '—' },
            ]}
          />
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(false)} title="Create API Key" size="md">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate() }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input text-sm" placeholder="e.g. Monitoring integration" required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Scopes (comma separated)</label>
            <input value={form.scopes} onChange={(e) => setForm({ ...form, scopes: e.target.value })} className="input text-sm" placeholder="read, write" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Expires at</label>
            <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="input text-sm" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button type="submit" disabled={create.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#2563eb' }}>{create.isPending ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!newKey} onClose={() => setNewKey(null)} title="API Key Created" size="md">
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Copy the secret below — it is shown only once and cannot be retrieved again.</p>
          <div className="rounded-lg p-3 font-mono text-sm break-all" style={{ background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}>
            {newKey?.key_secret}
          </div>
          <div className="flex justify-end">
            <button onClick={() => setNewKey(null)} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#2563eb' }}>Done</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}