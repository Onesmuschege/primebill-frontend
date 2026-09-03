import { render, screen, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import NotificationCenter from '../NotificationCenter'

const mockNotifications = [
  { id: 'ticket-1', category: 'ticket', title: 'Ticket #1024 — No internet', description: 'high priority', status: 'unread', createdAt: '2026-08-30T10:00:00Z', source: 'ticket', itemId: 1 },
  { id: 'alert-1', category: 'alert', title: '2 Routers Offline', description: 'of 10 total', status: 'active', createdAt: '2026-08-30T09:00:00Z', source: 'network' },
  { id: 'info-1', category: 'info', title: '3 Failed Automation Jobs', description: 'Requires investigation', status: 'active', createdAt: '2026-08-30T08:00:00Z', source: 'automation' },
  { id: 'system-1', category: 'system', title: 'User created', description: 'Admin added user', status: 'unread', createdAt: '2026-08-30T07:00:00Z', source: 'system' },
]

describe('NotificationCenter', () => {
  it('renders empty state when no notifications', () => {
    render(<NotificationCenter notifications={[]} counts={{ total: 0 }} />)
    expect(screen.getByText('All caught up!')).toBeTruthy()
  })

  it('renders total count badge', () => {
    render(<NotificationCenter notifications={mockNotifications} counts={{ total: 4 }} />)
    expect(screen.getByText('4')).toBeTruthy()
  })

  it('renders category sections', () => {
    render(<NotificationCenter notifications={mockNotifications} counts={{ total: 4 }} />)
    expect(screen.getByText('Action Required')).toBeTruthy()
    expect(screen.getByText('Alerts')).toBeTruthy()
  })

  it('renders notification titles', () => {
    render(<NotificationCenter notifications={mockNotifications} counts={{ total: 4 }} />)
    expect(screen.getByText('Ticket #1024 — No internet')).toBeTruthy()
    expect(screen.getByText('2 Routers Offline')).toBeTruthy()
  })

  it('calls onAction when View is clicked', () => {
    const onAction = vi.fn()
    render(<NotificationCenter notifications={[mockNotifications[0]]} counts={{ total: 1 }} onAction={onAction} />)
    fireEvent.click(screen.getByText('View'))
    expect(onAction).toHaveBeenCalledWith(mockNotifications[0])
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()
    render(<NotificationCenter notifications={mockNotifications} counts={{ total: 4 }} onClose={onClose} />)
    const closeBtn = screen.getByRole('button', { name: '' })
    fireEvent.click(closeBtn)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('toggles category sections', () => {
    render(<NotificationCenter notifications={mockNotifications} counts={{ total: 4 }} />)
    const infoSection = screen.getByText('Information')
    fireEvent.click(infoSection)
    expect(screen.getByText('3 Failed Automation Jobs')).toBeTruthy()
  })

  it('shows loading state', () => {
    render(<NotificationCenter notifications={[]} counts={{ total: 0 }} loading={true} />)
    expect(screen.getByText('Loading…')).toBeTruthy()
  })
})
