import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActionRail from '../ActionRail'
import OperationalTimeline from '../OperationalTimeline'
import { useAuth } from '../../../context/AuthContext'

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

beforeEach(() => {
  useAuth.mockReset()
  useAuth.mockReturnValue({ hasPermission: () => true })
})

// ---------------------------------------------------------------------------
// ActionRail
// ---------------------------------------------------------------------------
describe('ActionRail', () => {
  it('hides actions the operator is not authorized to perform', () => {
    useAuth.mockReturnValue({ hasPermission: (p) => p !== 'services.suspend' })
    render(
      <ActionRail
        actions={[
          { key: 'renew', label: 'Renew', onClick: vi.fn() },
          { key: 'suspend', label: 'Suspend', permission: 'services.suspend', onClick: vi.fn() },
        ]}
      />
    )
    expect(screen.getByRole('button', { name: /Renew/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Suspend/ })).not.toBeInTheDocument()
  })

  it('renders nothing when every action is unauthorized (hideWhenEmpty)', () => {
    useAuth.mockReturnValue({ hasPermission: () => false })
    const { container } = render(
      <ActionRail actions={[{ key: 'a', label: 'A', permission: 'x.y', onClick: vi.fn() }]} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('routes dangerous actions through ConfirmDialog before invoking onClick', async () => {
    const user = userEvent.setup()
    const onSuspend = vi.fn()
    render(
      <ActionRail
        actions={[
          {
            key: 'suspend',
            label: 'Suspend service',
            danger: true,
            confirm: {
              title: 'Suspend service',
              message: 'The customer will lose connectivity.',
              confirmLabel: 'Yes, suspend',
            },
            onClick: onSuspend,
          },
        ]}
      />
    )
    await user.click(screen.getByRole('button', { name: /Suspend service/ }))
    expect(onSuspend).not.toHaveBeenCalled()
    expect(screen.getByText('The customer will lose connectivity.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Yes, suspend' }))
    expect(onSuspend).toHaveBeenCalledTimes(1)
  })

  it('invokes non-confirmed actions directly', async () => {
    const user = userEvent.setup()
    const onRenew = vi.fn()
    render(<ActionRail actions={[{ key: 'renew', label: 'Renew', onClick: onRenew }]} />)
    await user.click(screen.getByRole('button', { name: /Renew/ }))
    expect(onRenew).toHaveBeenCalledTimes(1)
  })

  it('disables state-gated actions and surfaces the reason accessibly', () => {
    render(
      <ActionRail
        actions={[
          {
            key: 'activate',
            label: 'Activate',
            disabled: true,
            disabledReason: 'Service is terminated',
            onClick: vi.fn(),
          },
        ]}
      />
    )
    const btn = screen.getByRole('button', { name: /Activate/ })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('title', 'Service is terminated')
  })
})

// ---------------------------------------------------------------------------
// OperationalTimeline
// ---------------------------------------------------------------------------
describe('OperationalTimeline', () => {
  const events = [
    { id: 1, timestamp: '30 Aug 14:32', title: 'Payment received', tone: 'success', meta: { amount: 'KSh 2,000' } },
    { id: 2, timestamp: '30 Aug 14:33', title: 'Service renewed', tone: 'info' },
  ]

  it('renders events with timestamps and meta chips', () => {
    render(<OperationalTimeline events={events} />)
    expect(screen.getByText('Payment received')).toBeInTheDocument()
    expect(screen.getByText('30 Aug 14:32')).toBeInTheDocument()
    expect(screen.getByText(/amount: KSh 2,000/)).toBeInTheDocument()
  })

  it('renders a bounded feed with an overflow notice', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ id: i, timestamp: `t${i}`, title: `Event ${i}` }))
    render(<OperationalTimeline events={many} maxItems={25} />)
    expect(screen.getByText('Showing 25 of 30 events')).toBeInTheDocument()
    expect(screen.queryByText('Event 29')).not.toBeInTheDocument()
  })

  it('shows loading skeleton with aria-busy', () => {
    render(<OperationalTimeline events={[]} isLoading />)
    expect(screen.getByLabelText('Loading activity')).toHaveAttribute('aria-busy', 'true')
  })

  it('shows error state with retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    render(<OperationalTimeline events={[]} error={new Error('Network down')} onRetry={onRetry} />)
    expect(screen.getByText('Could not load activity')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Retry/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows an explanatory empty state', () => {
    render(<OperationalTimeline events={[]} />)
    expect(screen.getByText('No activity yet')).toBeInTheDocument()
  })
})
