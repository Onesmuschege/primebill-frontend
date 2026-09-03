import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PlatformNotifications from '../PlatformNotifications'

function renderNotifications(props) {
  return render(
    <MemoryRouter>
      <PlatformNotifications {...props} />
    </MemoryRouter>
  )
}

const STATS_WITH_CONDITIONS = {
  billing: { overdue_count: 2, outstanding_overdue_total: 18000, outstanding_total: 22000 },
  tenants: { by_status: { suspended: 1 } },
  security: { failed_logins_today: 3, security_events_this_week: 11 },
  infrastructure: { db: { status: 'connected' }, queue: { status: 'stopped' } },
}

describe('PlatformNotifications', () => {
  it('shows no badge when the platform is clean', () => {
    renderNotifications({ stats: {}, loading: false })
    expect(screen.queryByTestId('platform-notification-badge')).toBeNull()
  })

  it('derives the badge count from real action/alert conditions only', () => {
    renderNotifications({ stats: STATS_WITH_CONDITIONS, loading: false })
    // 1 action (overdue invoices) + 3 alerts (suspended tenant, failed logins, queue)
    const badge = screen.getByTestId('platform-notification-badge')
    expect(badge.textContent).toBe('4')
    expect(badge.style.backgroundColor).toBe('rgb(239, 68, 68)') // red while action-required exists
  })

  it('renders tiered items inside the panel', () => {
    renderNotifications({ stats: STATS_WITH_CONDITIONS, loading: false })
    fireEvent.click(screen.getByLabelText(/notifications/i))
    expect(screen.getByText('Action required')).toBeTruthy()
    expect(screen.getByText('Alerts')).toBeTruthy()
    expect(screen.getByText('2 overdue PrimeBill invoices')).toBeTruthy()
    expect(screen.getByText('1 suspended tenant')).toBeTruthy()
    expect(screen.getByText('QUEUE degraded')).toBeTruthy()
  })

  it('shows an honest all-clear message when there is nothing to report', () => {
    renderNotifications({ stats: {}, loading: false })
    fireEvent.click(screen.getByLabelText(/notifications/i))
    expect(screen.getByText(/All clear/i)).toBeTruthy()
  })

  it('does not render a panel while loading and empty', () => {
    renderNotifications({ stats: null, loading: true })
    fireEvent.click(screen.getByLabelText(/notifications/i))
    expect(screen.getByText('Loading…')).toBeTruthy()
  })
})
