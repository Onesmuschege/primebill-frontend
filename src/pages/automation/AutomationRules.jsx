import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAutomationRules, createAutomationRule, updateAutomationRule } from '../../api/automation.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'

const EMPTY = { name: '', event_type: '', priority: 0, is_active: true, action: {} }

export default function AutomationRules() {
  const qc = useQueryClient()
  const [withInactive, setWithInactive] = useState(false)
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const list = useQuery({
    queryKey: ['automation', 'rules', withInactive],
    queryFn: async () => {
      const res = await getAutomationRules(withInactive ? { with_inactive: true } : {})
      return Array.isArray(res.data?.data) ? res.data.data : []
    },
  })

  const save = useMutation({
    mutationFn: () => (editingId ? updateAutomationRule(editingId, form) : createAutomationRule(form)),
    onSuccess: () => {
      toast.success(editingId ? 'Rule updated' : 'Rule created')
      setModal(false); setEditingId(null); setForm(EMPTY)
      qc.invalidateQueries(['automation', 'rules'])
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Save failed'),
  })

  const toggle = useMutation({
    mutationFn: (r) => updateAutomationRule(r.id, { is_active: !r.is_active }),
    onSuccess: () => { toast.success('Rule toggled'); qc.invalidateQueries(['automation', 'rules']) },
    onError: (e) => toast.error(e.response?.data?.message || 'Update failed'),
  })

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setModal(true) }
  const openEdit = (r) => {
    setEditingId(r.id)
    setForm({
      name: r.name,
      event_type: r.event_type,
      priority: r.priority ?? 0,
      is_active: r.is_active,
      action: r.action ?? {},
    })
    setModal(true)
  }

  const rules = list.data || []

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Rules & Workflows</h2>
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Map events to automation actions, ordered by priority.</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#2563eb' }}>
          <Plus className="inline w-4 h-4 mr-1" /> New Rule
        </button>
      </div>

      <div className="card space-y-3">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-2)' }}>
          <input type="checkbox" checked={withInactive} onChange={(e) => setWithInactive(e.target.checked)} />
          Show inactive rules
        </label>

        <Table
          loading={list.isLoading}
          emptyMessage="No automation rules yet."
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'event_type', label: 'Event', render: (r) => <code className="text-xs">{r.event_type}</code> },
            { key: 'priority', label: 'Priority', render: (r) => <Badge label={r.priority} variant="info" /> },
            { key: 'status', label: 'Status', render: (r) => r.is_active ? <Badge label="active" variant="active" /> : <Badge label="inactive" variant="inactive" /> },
            {
              key: 'actions', label: '',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(r)} className="px-2 py-1 text-[11px] rounded-md text-white" style={{ background: '#2563eb' }}>Edit</button>
                  <button
                    onClick={() => toggle.mutate(r)}
                    disabled={toggle.isPending}
                    className="px-2 py-1 text-[11px] rounded-md text-white disabled:opacity-50"
                    style={{ background: r.is_active ? '#dc2626' : '#10b981' }}
                  >
                    {r.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              ),
            },
          ]}
          data={rules}
        />
      </div>

      <Modal isOpen={modal} onClose={() => { setModal(false); setEditingId(null) }} title={editingId ? 'Edit Rule' : 'New Rule'}>
        <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Name *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input text-sm w-full" required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Event type *</label>
            <input value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="input text-sm w-full" placeholder="payment_received" required />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>Priority</label>
            <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="input text-sm w-full" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            <span className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Active</span>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50" style={{ background: '#2563eb' }}>{save.isPending ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
