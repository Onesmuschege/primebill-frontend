import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import {
  CATALOG_GROUPS, resourceLabel, listCatalog,
  createCatalogItem, updateCatalogItem, deleteCatalogItem, transitionCampaign,
} from '../../api/catalog.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { formatDate } from '../../utils/formatDate'
import { Pencil, Trash2, Search, Plus, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const titleOf = (row = {}) =>
  row.name || row.title || row.event || row.code || row.type || `#${row.id}`

const FALLBACK_COLUMNS = ['name', 'code', 'type', 'status', 'severity', 'event', 'title', 'subject', 'category']

const mutedText = { color: 'var(--pb-text-3)' }

// ---------------------------------------------------------------------------
// Resource-specific create/edit forms. Only the domains that had zero usable
// UI despite a complete backend (webhooks, campaigns, announcements, KB
// articles/categories) get a real form — every other catalog resource keeps
// the generic read + delete browser below it, same as before this rewrite.
// Field shapes here are taken directly from each table's migration, not
// guessed.
// ---------------------------------------------------------------------------

function WebhookForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    url: initial?.url || '',
    method: initial?.method || 'POST',
    events: (initial?.events || []).join(', '),
    status: initial?.status || 'active',
    timeout: initial?.timeout ?? 30,
    retry_count: initial?.retry_count ?? 3,
  })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({
      ...form,
      timeout: Number(form.timeout),
      retry_count: Number(form.retry_count),
      events: form.events.split(',').map(s => s.trim()).filter(Boolean),
    }) }} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <label className="label">Target URL *</label>
        <input type="url" className="input" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} placeholder="https://example.com/webhook" required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Method</label>
          <select className="input" value={form.method} onChange={e => setForm({ ...form, method: e.target.value })}>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Events (comma-separated)</label>
        <input className="input" value={form.events} onChange={e => setForm({ ...form, events: e.target.value })} placeholder="payment.completed, ticket.created" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Timeout (seconds)</label>
          <input type="number" min="1" className="input" value={form.timeout} onChange={e => setForm({ ...form, timeout: e.target.value })} />
        </div>
        <div>
          <label className="label">Retry Count</label>
          <input type="number" min="0" className="input" value={form.retry_count} onChange={e => setForm({ ...form, retry_count: e.target.value })} />
        </div>
      </div>
      <FormFooter submitting={submitting} />
    </form>
  )
}

function CampaignForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    type: initial?.type || 'email',
    category: initial?.category || 'marketing',
    subject: initial?.subject || '',
    content: initial?.content || '',
    priority: initial?.priority || 'normal',
  })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="multi">Multi-channel</option>
          </select>
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            <option value="marketing">Marketing</option>
            <option value="support">Support</option>
            <option value="billing">Billing</option>
            <option value="system">System</option>
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Subject</label>
        <input className="input" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
      </div>
      <div>
        <label className="label">Content *</label>
        <textarea className="input" rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
      </div>
      <FormFooter submitting={submitting} />
    </form>
  )
}

function AnnouncementForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState({
    title: initial?.title || '',
    type: initial?.type || 'general',
    priority: initial?.priority || 'normal',
    summary: initial?.summary || '',
    content: initial?.content || '',
    starts_at: initial?.starts_at || '',
    ends_at: initial?.ends_at || '',
    is_published: initial?.is_published ?? false,
    send_notification: initial?.send_notification ?? false,
  })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="general">General</option>
            <option value="maintenance">Maintenance</option>
            <option value="outage">Outage</option>
            <option value="billing">Billing</option>
            <option value="feature">Feature</option>
          </select>
        </div>
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Summary</label>
        <input className="input" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
      </div>
      <div>
        <label className="label">Content *</label>
        <textarea className="input" rows={5} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Starts</label>
          <input type="date" className="input" value={form.starts_at || ''} onChange={e => setForm({ ...form, starts_at: e.target.value })} />
        </div>
        <div>
          <label className="label">Ends</label>
          <input type="date" className="input" value={form.ends_at || ''} onChange={e => setForm({ ...form, ends_at: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-1)' }}>
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-1)' }}>
          <input type="checkbox" checked={form.send_notification} onChange={e => setForm({ ...form, send_notification: e.target.checked })} />
          Notify on publish
        </label>
      </div>
      <FormFooter submitting={submitting} />
    </form>
  )
}

function KbArticleForm({ initial, onSubmit, submitting }) {
  const { data: categories } = useQuery({
    queryKey: ['catalog-kb-categories-picker'],
    queryFn: () => listCatalog('support-catalog', 'kb-categories', { per_page: 100 }),
  })
  const [form, setForm] = useState({
    title: initial?.title || '',
    category_id: initial?.category_id || '',
    summary: initial?.summary || '',
    content: initial?.content || '',
    tags: (initial?.tags || []).join(', '),
    is_published: initial?.is_published ?? false,
    is_featured: initial?.is_featured ?? false,
  })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({
      ...form,
      category_id: form.category_id || null,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    }) }} className="space-y-4">
      <div>
        <label className="label">Title *</label>
        <input className="input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
      </div>
      <div>
        <label className="label">Category</label>
        <select className="input" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
          <option value="">None</option>
          {categories?.data?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label">Summary</label>
        <input className="input" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} />
      </div>
      <div>
        <label className="label">Content *</label>
        <textarea className="input" rows={6} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} required />
      </div>
      <div>
        <label className="label">Tags (comma-separated)</label>
        <input className="input" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-1)' }}>
          <input type="checkbox" checked={form.is_published} onChange={e => setForm({ ...form, is_published: e.target.checked })} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-1)' }}>
          <input type="checkbox" checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
          Featured
        </label>
      </div>
      <FormFooter submitting={submitting} />
    </form>
  )
}

function KbCategoryForm({ initial, onSubmit, submitting }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    is_active: initial?.is_active ?? true,
  })
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <div>
        <label className="label">Name *</label>
        <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-1)' }}>
        <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
        Active
      </label>
      <FormFooter submitting={submitting} />
    </form>
  )
}

function FormFooter({ submitting }) {
  return (
    <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? 'Saving...' : 'Save'}
      </button>
    </div>
  )
}

// Maps resource key -> form component. Anything not listed here falls back
// to the generic read-only detail view + delete, same as before this rewrite.
const RESOURCE_FORMS = {
  'webhooks': WebhookForm,
  'campaigns': CampaignForm,
  'announcements': AnnouncementForm,
  'kb-articles': KbArticleForm,
  'kb-categories': KbCategoryForm,
}

export default function CatalogPage() {
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()

  const [group, setGroup] = useState(CATALOG_GROUPS[0])
  const [resource, setResource] = useState(CATALOG_GROUPS[0].resources[0])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)
  const [formOpen, setFormOpen] = useState(null) // null | 'create' | row-being-edited

  const canManage = hasPermission(`manage ${group.prefix}`)
  const FormComponent = RESOURCE_FORMS[resource]

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['catalog', group.prefix, resource, page, debouncedSearch],
    queryFn: () => listCatalog(group.prefix, resource, { page, search: debouncedSearch || undefined }),
    keepPreviousData: true,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['catalog', group.prefix, resource] })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCatalogItem(group.prefix, resource, id),
    onSuccess: () => { toast.success('Item deleted'); invalidate() },
    onError: () => toast.error('Delete failed'),
  })

  const saveMutation = useMutation({
    mutationFn: (payload) => formOpen === 'create'
      ? createCatalogItem(group.prefix, resource, payload)
      : updateCatalogItem(group.prefix, resource, formOpen.id, payload),
    onSuccess: () => {
      toast.success(formOpen === 'create' ? 'Created' : 'Updated')
      setFormOpen(null)
      invalidate()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  })

  const transitionMutation = useMutation({
    mutationFn: ({ id, status }) => transitionCampaign(id, { status }),
    onSuccess: () => { toast.success('Campaign updated'); setDetail(null); invalidate() },
    onError: (err) => toast.error(err.response?.data?.message || 'Transition failed'),
  })

  const onSearchChange = (value) => {
    setSearch(value)
    setPage(1)
    clearTimeout(onSearchChange._t)
    onSearchChange._t = setTimeout(() => setDebouncedSearch(value), 350)
  }

  const switchGroup = (g) => {
    setGroup(g)
    setResource(g.resources[0])
    setSearch(''); setDebouncedSearch(''); setPage(1); setDetail(null)
  }

  const switchResource = (r) => {
    setResource(r)
    setSearch(''); setDebouncedSearch(''); setPage(1); setDetail(null)
  }

  const columns = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'title', label: 'Name / Type', render: (row) => <span className="font-medium">{titleOf(row)}</span> },
    ...FALLBACK_COLUMNS
      .filter((c) => (data?.data || []).some((r) => r[c] != null && c !== 'name' && c !== 'title'))
      .slice(0, 2)
      .map((c) => ({ key: c, label: resourceLabel(c) })),
    { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
    {
      key: 'actions', label: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setDetail(row)} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--pb-text-3)' }} title="View details">
            <Pencil size={14} />
          </button>
          {canManage && (
            <button
              onClick={() => { if (window.confirm(`Delete ${titleOf(row)}? This cannot be undone.`)) deleteMutation.mutate(row.id) }}
              className="p-1.5 rounded-lg transition-colors" style={{ color: '#f87171' }} title="Delete"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ),
    },
  ], [data, canManage, deleteMutation])

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--pb-text-1)' }}>Catalog / Reference Data</h2>
        <div className="flex flex-wrap gap-2">
          {CATALOG_GROUPS.map((g) => (
            <button
              key={g.prefix}
              onClick={() => switchGroup(g)}
              className="px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={group.prefix === g.prefix
                ? { backgroundColor: '#2563eb', color: '#fff' }
                : { backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}
            >
              {g.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--pb-border)' }}>
          {group.resources.map((r) => (
            <button
              key={r}
              onClick={() => switchResource(r)}
              className="px-2.5 py-1 rounded-md text-xs font-medium transition-colors"
              style={resource === r
                ? { backgroundColor: 'rgba(37,99,235,0.15)', color: '#60a5fa' }
                : { color: 'var(--pb-text-3)' }}
            >
              {resourceLabel(r)}
            </button>
          ))}
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-2.5" style={mutedText} />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${resourceLabel(resource).toLowerCase()}...`}
            className="input text-sm pl-9"
          />
        </div>
        <p className="text-sm" style={mutedText}>
          Browsing <strong style={{ color: 'var(--pb-text-2)' }}>{group.label}</strong> &middot; {resourceLabel(resource)}
        </p>
        {canManage && (
          <button onClick={() => setFormOpen('create')} className="btn-primary ml-auto">
            <Plus size={14} /> New {resourceLabel(resource)}
            {!FormComponent && <span className="text-xs font-normal ml-1">(basic)</span>}
          </button>
        )}
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading && <div className="py-16"><Spinner size="lg" /></div>}
        {isError && (
          <div className="px-6 py-16 text-center text-sm">
            <p className="font-medium" style={{ color: '#f87171' }}>Failed to load {resourceLabel(resource).toLowerCase()}</p>
            <p className="mt-1 text-xs" style={mutedText}>
              {error?.response?.status === 403
                ? "You don't have permission to view this catalog."
                : 'Please check your connection and try again.'}
            </p>
          </div>
        )}
        {!isLoading && !isError && (
          <>
            <Table
              loading={false}
              data={data?.data || []}
              emptyMessage={`No ${resourceLabel(resource).toLowerCase()} found`}
              onRowClick={(row) => setDetail(row)}
              columns={columns}
            />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      {/* Detail modal — campaigns get an extra lifecycle-transition action */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`${resourceLabel(resource)} · #${detail?.id ?? ''}`} size="lg">
        {detail && (
          <div className="space-y-4">
            {resource === 'campaigns' && (
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--pb-raised)' }}>
                <div>
                  <span className="badge badge-info">{detail.status}</span>
                </div>
                <div className="flex gap-2">
                  {detail.status === 'draft' && (
                    <button onClick={() => transitionMutation.mutate({ id: detail.id, status: 'scheduled' })} className="btn-secondary text-xs py-1.5">
                      Schedule
                    </button>
                  )}
                  {['draft', 'scheduled'].includes(detail.status) && (
                    <button onClick={() => transitionMutation.mutate({ id: detail.id, status: 'sent' })} className="btn-primary text-xs py-1.5">
                      <Send size={13} /> Send now
                    </button>
                  )}
                  {['draft', 'scheduled'].includes(detail.status) && (
                    <button onClick={() => transitionMutation.mutate({ id: detail.id, status: 'cancelled' })} className="btn-secondary text-xs py-1.5" style={{ color: '#f87171' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              {Object.entries(detail).filter(([k]) => k !== 'tenant_id').map(([k, v]) => (
                <div key={k} className="flex gap-2 pb-1.5" style={{ borderBottom: '1px solid var(--pb-border)' }}>
                  <span className="w-32 shrink-0 font-medium" style={{ color: 'var(--pb-text-2)' }}>{k}</span>
                  <span className="break-all" style={{ color: 'var(--pb-text-1)' }}>
                    {Array.isArray(v) || (v && typeof v === 'object') ? JSON.stringify(v) : String(v ?? '—')}
                  </span>
                </div>
              ))}
            </div>

            {canManage && FormComponent && (
              <div className="flex justify-end pt-2">
                <button onClick={() => { setFormOpen(detail); setDetail(null) }} className="btn-secondary">
                  <Pencil size={14} /> Edit
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create / Edit form modal — only rendered for resources with a real form */}
      <Modal
        isOpen={!!formOpen}
        onClose={() => setFormOpen(null)}
        title={`${formOpen === 'create' ? 'New' : 'Edit'} ${resourceLabel(resource)}`}
        size="lg"
      >
        {formOpen && FormComponent && (
          <FormComponent
            initial={formOpen === 'create' ? null : formOpen}
            submitting={saveMutation.isPending}
            onSubmit={(payload) => saveMutation.mutate(payload)}
          />
        )}
      </Modal>
    </div>
  )
}
