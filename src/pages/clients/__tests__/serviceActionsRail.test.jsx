import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ServiceActionsRail from '../ServiceActionsRail'

// Permission gate comes from useAuth (ActionRail filters actions by it).
vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ hasPermission: () => true })),
}))
import { useAuth } from '../../../context/AuthContext'

const renderRail = (props) => {
  const mutation = { isPending: false, mutate: vi.fn() }
  return render(
    <ServiceActionsRail
      stateLabel="Active"
      username="test@isp"
      canSuspend
      canRestore={false}
      isTerminal={false}
      hasSession
      sessionCount={1}
      suspend={mutation}
      restore={mutation}
      disconnect={mutation}
      onCoa={vi.fn()}
      onRefresh={vi.fn()}
      {...props}
    />
  )
}

beforeEach(() => {
  useAuth.mockReturnValue({ hasPermission: () => true })
})

describe('ServiceActionsRail — state-aware gating', () => {
  it('enables Suspend and disables Restore when the service is ACTIVE', () => {
    renderRail()
    expect(screen.getByRole('button', { name: /suspend/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /restore/i })).toBeDisabled()
  })

  it('suspends only after explicit confirmation', async () => {
    const user = userEvent.setup()
    const suspend = { isPending: false, mutate: vi.fn() }
    renderRail({ suspend })
    await user.click(screen.getByRole('button', { name: /suspend/i }))
    // Confirmation dialog must appear — no direct mutation
    expect(screen.getByText(/administrative hold/i)).toBeInTheDocument()
    // The dialog's confirm button and the toolbar button share the label —
    // the dialog renders later in the DOM.
    const suspendButtons = screen.getAllByRole('button', { name: /^suspend$/i })
    await user.click(suspendButtons[suspendButtons.length - 1])
    expect(suspend.mutate).toHaveBeenCalledTimes(1)
  })

  it('disables Disconnect/CoA when the service has no active session', () => {
    renderRail({ hasSession: false, sessionCount: 0 })
    expect(screen.getByRole('button', { name: /disconnect/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /coa/i })).toBeDisabled()
  })

  it('disables Suspend on a TERMINATED service regardless of transitions', () => {
    renderRail({ canSuspend: false, isTerminal: true, canRestore: false, hasSession: false, stateLabel: 'Terminated' })
    expect(screen.getByRole('button', { name: /suspend/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /restore/i })).toBeDisabled()
  })
})
