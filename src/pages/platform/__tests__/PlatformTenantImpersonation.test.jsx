import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from '../../../context/AuthContext'
import * as platformApi from '../../../api/platform.api'

// Mock the platform API — impersonation endpoints are the focus of P2C.
vi.mock('../../../api/platform.api', () => ({
  impersonateTenant: vi.fn(),
  endImpersonation: vi.fn(),
}))

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } })
}

// A lightweight harness that exposes startImpersonation/endImpersonation via a
// probe component consuming the AuthContext — this mirrors how PlatformTenantDetail
// consumes the 2-step impersonation flow (reason dialog → API → mode selection).
function ImpersonationProbe({ onComplete }) {
  const { startImpersonation, endImpersonation, impersonation, user } = useAuth()
  return (
    <div>
      <span data-testid="current-user">{user?.email ?? 'none'}</span>
      <span data-testid="impersonation-state">{impersonation ? JSON.stringify(impersonation) : 'none'}</span>
      <button
        data-testid="start-impersonation"
        onClick={async () => {
          const res = await startImpersonation(7, 'Acme ISP', 'investigating outage ticket #4812', 'view')
          onComplete?.(res)
        }}
      >
        Start
      </button>
      <button
        data-testid="end-impersonation"
        onClick={async () => {
          const res = await endImpersonation()
          onComplete?.(res)
        }}
      >
        End
      </button>
    </div>
  )
}

function renderHarness() {
  const queryClient = makeQueryClient()
  const originalUser = { id: 1, name: 'Platform Operator', email: 'op@primebill.test', is_platform_admin: true, roles: ['staff'], permissions: [] }
  localStorage.setItem('user', JSON.stringify(originalUser))
  localStorage.setItem('token', 'platform-admin-token')

  const captured = {}
  const onComplete = (res) => { captured.last = res }
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AuthProvider>
          <ImpersonationProbe onComplete={onComplete} />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return { ...utils, originalUser, captured }
}

describe('PlatformTenantImpersonation — 2-step flow (P2C)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('passes reason + mode to the backend on the impersonation POST', async () => {
    // Backend contract: POST /platform/tenants/{id}/impersonate { reason, mode }
    platformApi.impersonateTenant.mockResolvedValueOnce({
      data: {
        data: {
          token: 'impersonation-token-abc',
          admin: { id: 42, name: 'Acme Admin', email: 'admin@acme.test' },
          tenant: { id: 7, name: 'Acme ISP' },
        },
      },
    })

    const { captured } = renderHarness()
    fireEvent.click(screen.getByTestId('start-impersonation'))

    await waitFor(() => {
      expect(platformApi.impersonateTenant).toHaveBeenCalledWith(7, 'investigating outage ticket #4812', 'view')
    })
    await waitFor(() => {
      expect(captured.last).toEqual({ success: true, tenant: { id: 7, name: 'Acme ISP' } })
    })
  })

  it('switches the active user and stores the original identity for restoration', async () => {
    platformApi.impersonateTenant.mockResolvedValueOnce({
      data: {
        data: {
          token: 'impersonation-token-abc',
          admin: { id: 42, name: 'Acme Admin', email: 'admin@acme.test' },
          tenant: { id: 7, name: 'Acme ISP' },
        },
      },
    })
    platformApi.endImpersonation.mockResolvedValueOnce({ data: { data: null } })

    const { originalUser } = renderHarness()

    // Step 1: start impersonation.
    fireEvent.click(screen.getByTestId('start-impersonation'))
    await waitFor(() => expect(platformApi.impersonateTenant).toHaveBeenCalledTimes(1))

    // The current user should now be the impersonated tenant admin (not the platform operator).
    await waitFor(() => {
      expect(screen.getByTestId('current-user').textContent).toBe('admin@acme.test')
    })

    // The impersonation context object should carry reason + view mode.
    await waitFor(() => {
      const state = JSON.parse(screen.getByTestId('impersonation-state').textContent)
      expect(state.tenantId).toBe(7)
      expect(state.tenantName).toBe('Acme ISP')
      expect(state.adminId).toBe(42)
      expect(state.reason).toBe('investigating outage ticket #4812')
      expect(state.mode).toBe('view')
    })

    // The original identity must be preserved (in localStorage) for restore.
    expect(localStorage.getItem('pb-original-user')).toBeTruthy()
    expect(localStorage.getItem('token')).toBe('impersonation-token-abc')

    // Step 2: end impersonation — should restore the original platform user.
    fireEvent.click(screen.getByTestId('end-impersonation'))
    await waitFor(() => {
      expect(screen.getByTestId('current-user').textContent).toBe(originalUser.email)
    })
    await waitFor(() => {
      expect(screen.getByTestId('impersonation-state').textContent).toBe('none')
    })
  })

  it('clears the token and impersonation state from localStorage on end', async () => {
    platformApi.impersonateTenant.mockResolvedValueOnce({
      data: {
        data: {
          token: 'imp-token',
          admin: { id: 99, name: 'Other Admin', email: 'other@test.com' },
          tenant: { id: 3, name: 'Other ISP' },
        },
      },
    })
    platformApi.endImpersonation.mockResolvedValueOnce({ data: { data: null } })

    renderHarness()

    fireEvent.click(screen.getByTestId('start-impersonation'))
    await waitFor(() => expect(screen.getByTestId('impersonation-state').textContent).not.toBe('none'))

    fireEvent.click(screen.getByTestId('end-impersonation'))

    await waitFor(() => {
      expect(localStorage.getItem('pb-impersonation')).toBeNull()
      expect(localStorage.getItem('pb-original-user')).toBeNull()
    })
  })
})
