import { useState } from 'react'
import { ChevronUp, ChevronDown, Edit, Trash2, Pause, Play, Gavel } from 'lucide-react'
import Table from '../common/Table'
import Spinner from '../common/Spinner'

const ACTION_LABEL = {
  email: 'Email reminder',
  sms: 'SMS reminder',
  call: 'Manual call',
  suspend: 'Suspend services',
  escalate: 'Escalate',
}

const ACTION_BADGE = {
  email: 'badge-info',
  sms: 'badge-info',
  call: 'badge-unpaid',
  suspend: 'badge-suspended',
  escalate: 'badge-overdue',
}

/**
 * Dunning step ladder (the escalation config) as an operational table.
 * Presentational: all mutations are owned by the parent (CollectionsPage) and
 * surfaced here via callbacks, so this component holds no business state.
 */
export default function DunningStepTable({ steps, canManage, loading, onEdit, onMove, onToggle, onDelete, onAdd }) {
  const [toggling, setToggling] = useState(null)

  const handleToggle = (step) => {
    setToggling(step.id)
    Promise.resolve(onToggle(step)).finally(() => setToggling(null))
  }

  const handleMove = (index, dir) => {
    onMove(index, dir)
  }

  const columns = [
    {
      key: 'sequence',
      label: '#',
      render: (row, _, i) => i + 1,
    },
    { key: 'name', label: 'Name' },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <span className={`badge ${ACTION_BADGE[row.action] ?? 'badge-inactive'}`}>
          {ACTION_LABEL[row.action] ?? row.action}
        </span>
      ),
    },
    { key: 'days_after_due', label: 'After due (days)' },
    { key: 'template', label: 'Template' },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) => (
        <span className={row.is_active ? 'badge badge-paid' : 'badge badge-inactive'}>
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  // Action column is only rendered for managers (backend enforces the same).
  if (canManage) {
    columns.push({
      key: 'actions',
      label: '',
      render: (row, _row, index) => (
        <div className="flex items-center justify-end gap-1">
          <button
            className="action-btn"
            title="Move up"
            onClick={() => handleMove(index, 'up')}
            disabled={index === 0}
          >
            <ChevronUp size={14} />
          </button>
          <button
            className="action-btn"
            title="Move down"
            onClick={() => handleMove(index, 'down')}
            disabled={index === steps.length - 1}
          >
            <ChevronDown size={14} />
          </button>
          <button className="action-btn" title="Edit" onClick={() => onEdit(row)}>
            <Edit size={14} />
          </button>
          <button
            className="action-btn"
            title={row.is_active ? 'Deactivate' : 'Activate'}
            onClick={() => handleToggle(row)}
            disabled={toggling === row.id}
          >
            {toggling === row.id ? (
              <Spinner size="sm" />
            ) : row.is_active ? (
              <Pause size={14} />
            ) : (
              <Play size={14} />
            )}
          </button>
          <button
            className="action-btn"
            title="Delete"
            onClick={() => onDelete(row)}
            disabled={toggling === row.id}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    })
  }

  return (
    <div className="space-y-2">
      {canManage && (
        <div className="flex justify-end">
          <button className="btn-primary" onClick={onAdd}>
            + New step
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--pb-border)' }}>
        <table className="table w-full">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <Spinner size="md" />
                </td>
              </tr>
            ) : steps.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-sm" style={{ color: 'var(--pb-text-3)' }}>
                  No dunning steps configured yet.
                </td>
              </tr>
            ) : (
              steps.map((step, i) => (
                <tr key={step.id}>
                  {columns.map((col) => (
                    <td key={col.key} className="pr-2">
                      {col.render ? col.render(step, step, i) : step[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!canManage && (
        <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
          <Gavel size={12} className="inline mr-1" /> You have view-only access to the
          dunning ladder.
        </p>
      )}
    </div>
  )
}
