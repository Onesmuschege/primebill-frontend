import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import WorkQueue from '../WorkQueue'

const sampleItems = [
  { id: '1', title: 'Ticket #1024 — No internet', source: 'ticket', priority: 'high', status: 'open', createdAt: '2026-08-30T10:00:00Z', owner: 'Unassigned' },
  { id: '2', title: 'Invoice INV-00842 overdue', source: 'invoice', priority: 'critical', status: 'overdue', createdAt: '2026-08-25T08:00:00Z' },
  { id: '3', title: 'Payment PAY-991 failed allocation', source: 'payment', priority: 'medium', status: 'failed', createdAt: '2026-08-29T14:30:00Z', owner: 'Jane' },
]

describe('WorkQueue', () => {
  it('renders a row per item with title, source and priority', () => {
    render(<WorkQueue items={sampleItems} />)
    expect(screen.getByText('Ticket #1024 — No internet')).toBeTruthy()
    expect(screen.getByText('Invoice INV-00842 overdue')).toBeTruthy()
    expect(screen.getByText('Payment PAY-991 failed allocation')).toBeTruthy()
    expect(screen.getByText('critical')).toBeTruthy()
    expect(screen.getByText('high')).toBeTruthy()
  })

  it('renders owner and relative time when present', () => {
    render(<WorkQueue items={sampleItems} />)
    expect(screen.getByText('Unassigned')).toBeTruthy()
    expect(screen.getByText('Jane')).toBeTruthy()
    expect(screen.getAllByText(/ago$/).length).toBeGreaterThan(0)
  })

  it('shows empty state when no items', () => {
    render(<WorkQueue items={[]} />)
    expect(screen.getByText('No work requiring attention')).toBeTruthy()
    expect(screen.getByText('All clear — nothing needs action right now.')).toBeTruthy()
  })

  it('shows loading skeleton when loading', () => {
    render(<WorkQueue items={[]} loading />)
    expect(screen.queryByText('No work requiring attention')).toBeNull()
  })

  it('shows error state with retry when error', () => {
    const onRetry = vi.fn()
    render(<WorkQueue items={[]} error="Failed" onRetry={onRetry} />)
    expect(screen.getByText('Failed to load work queue.')).toBeTruthy()
    fireEvent.click(screen.getByText('Retry'))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('supports row selection and select-all toggle', () => {
    render(<WorkQueue items={sampleItems} />)
    const selectAll = screen.getByLabelText('Select all')
    fireEvent.click(selectAll)
    expect(screen.getByText('3 selected')).toBeTruthy()
    fireEvent.click(selectAll)
    expect(screen.getByText('Select all')).toBeTruthy()
  })

  it('invokes onAction when an item action button is clicked', () => {
    const onAction = vi.fn()
    const items = [{ ...sampleItems[0], onAction: true, actionLabel: 'Assign' }]
    render(<WorkQueue items={items} onAction={onAction} />)
    fireEvent.click(screen.getByText('Assign'))
    expect(onAction).toHaveBeenCalledWith(items[0])
  })

  it('hides selection UI when selectable=false', () => {
    render(<WorkQueue items={sampleItems} selectable={false} />)
    expect(screen.queryByText('Select all')).toBeNull()
  })
})
