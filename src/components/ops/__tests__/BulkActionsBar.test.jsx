import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import BulkActionsBar from '../BulkActionsBar'

const mockActions = [
  { key: 'suspend', label: 'Suspend', destructive: true, onExecute: vi.fn().mockResolvedValue({ data: { succeeded: 2, failed: 0, results: [] } }) },
  { key: 'export', label: 'Export', destructive: false, onExecute: vi.fn().mockResolvedValue({}) },
]

describe('BulkActionsBar', () => {
  it('renders nothing when no items selected', () => {
    render(<BulkActionsBar selectedIds={[]} actions={mockActions} onClear={vi.fn()} />)
    expect(screen.queryByText('selected')).toBeNull()
  })

  it('renders selected count and actions', () => {
    render(<BulkActionsBar selectedIds={[1, 2]} actions={mockActions} onClear={vi.fn()} />)
    expect(screen.getByText('2 selected')).toBeTruthy()
    expect(screen.getByText('Suspend')).toBeTruthy()
    expect(screen.getByText('Export')).toBeTruthy()
  })

  it('calls onClear when Clear is clicked', () => {
    const onClear = vi.fn()
    render(<BulkActionsBar selectedIds={[1]} actions={mockActions} onClear={onClear} />)
    fireEvent.click(screen.getByText('Clear'))
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('shows confirmation for destructive actions', () => {
    render(<BulkActionsBar selectedIds={[1, 2]} actions={mockActions} onClear={vi.fn()} />)
    fireEvent.click(screen.getByText('Suspend'))
    expect(screen.getByText('Apply to 2 records?')).toBeTruthy()
  })

  it('executes non-destructive actions immediately', async () => {
    const onExecute = vi.fn().mockResolvedValue({})
    const actions = [{ key: 'export', label: 'Export', destructive: false, onExecute }]
    render(<BulkActionsBar selectedIds={[1]} actions={actions} onClear={vi.fn()} />)
    fireEvent.click(screen.getByText('Export'))
    await waitFor(() => expect(onExecute).toHaveBeenCalledWith([1]))
  })

  it('shows result summary after execution', () => {
    render(
      <BulkActionsBar
        selectedIds={[]}
        actions={mockActions}
        onClear={vi.fn()}
        result={{ succeeded: 5, failed: 1, skipped: 0, results: [] }}
      />
    )
    expect(screen.getByText('5 succeeded, 1 failed')).toBeTruthy()
  })

  it('calls onDismissResult when Dismiss is clicked', () => {
    const onDismissResult = vi.fn()
    render(
      <BulkActionsBar
        selectedIds={[]}
        actions={mockActions}
        onClear={vi.fn()}
        result={{ succeeded: 1, failed: 0, skipped: 0, results: [] }}
        onDismissResult={onDismissResult}
      />
    )
    fireEvent.click(screen.getByText('Dismiss'))
    expect(onDismissResult).toHaveBeenCalledTimes(1)
  })
})
