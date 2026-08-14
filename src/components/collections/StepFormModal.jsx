import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { createDunningStep, updateDunningStep } from '../../api/collections.api'
import Modal from '../common/Modal'
import Spinner from '../common/Spinner'

/**
 * Create / edit a dunning escalation step (the collections ladder).
 * Self-contained: owns its mutations and invalidates the steps query on
 * success so the parent table re-fetches. The parent only opens it for users
 * with `manage dunning`, and the backend re-checks that permission on the
 * POST/PUT routes.
 *
 * `action` mirrors the enum in 2026_08_08_000007_create_collections_tables.php.
 */
const ACTIONS = [
  { value: 'email',    label: 'Email reminder' },
  { value: 'sms',      label: 'SMS reminder' },
  { value: 'call',     label: 'Manual call' },
  { value: 'suspend',  label: 'Suspend services' },
  { value: 'escalate', label: 'Escalate (legal / collections)' },
]

export default function StepFormModal({ isOpen, onClose, step, onSaved }) {
  const isEdit = Boolean(step)
  const queryClient = useQueryClient()

  const [form, setForm] = useState({
    name: step?.name ?? '',
    action: step?.action ?? 'email',
    sequence: step?.sequence ?? 1,
    days_after_due: step?.days_after_due ?? 0,
    template: step?.template ?? '',
    is_active: step?.is_active ?? true,
  })

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit ? updateDunningStep(step.id, payload) : createDunningStep(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections-steps'] })
      toast.success(`Dunning step ${isEdit ? 'updated' : 'created'}`)
      onSaved?.()
      onClose()
    },
    onError: () => toast.error(`Could not ${isEdit ? 'update' : 'create'} step`),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate({
      name: form.name,
      action: form.action,
      sequence: Number(form.sequence),
      days_after_due: Number(form.days_after_due),
      template: form.template || null,
      is_active: Boolean(form.is_active),
    })
  }

  const valid = !!form.name && !!form.sequence && !!form.action

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Dunning Step' : 'New Dunning Step'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>
            Name
          </label>
          <input
            className="input w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. First reminder (3d)"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>
              Sequence
            </label>
            <input
              type="number"
              min={1}
              className="input w-full"
              value={form.sequence}
              onChange={(e) => setForm({ ...form, sequence: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>
              After due (days)
            </label>
            <input
              type="number"
              min={0}
              className="input w-full"
              value={form.days_after_due}
              onChange={(e) => setForm({ ...form, days_after_due: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>
            Action
          </label>
          <select
            className="input w-full"
            value={form.action}
            onChange={(e) => setForm({ ...form, action: e.target.value })}
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>
            Template key
          </label>
          <input
            className="input w-full"
            value={form.template}
            onChange={(e) => setForm({ ...form, template: e.target.value })}
            placeholder="e.g. dunning.email.first"
          />
        </div>

        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-1)' }}>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active — included in the next dunning run
        </label>

        <div
          className="flex justify-end gap-2 pt-2"
          style={{ borderTop: '1px solid var(--pb-border)' }}
        >
          <button type="button" className="btn-secondary" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={mutation.isPending || !valid}>
            {mutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              <>
                <Save size={14} className="mr-1" /> {isEdit ? 'Save' : 'Create'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
