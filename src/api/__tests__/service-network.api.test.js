import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as sn from '../service-network.api'

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

describe('service-network.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches network status for a service account', async () => {
    await sn.getServiceNetworkStatus(42)
    expect(api.get).toHaveBeenCalledWith('/network/services/42/status')
  })

  it('suspends a service with a reason', async () => {
    await sn.suspendService(42, { reason: 'Non-payment' })
    expect(api.post).toHaveBeenCalledWith('/network/services/42/suspend', { reason: 'Non-payment' })
  })

  it('restores a service with a reason', async () => {
    await sn.restoreService(42, { reason: 'Payment received' })
    expect(api.post).toHaveBeenCalledWith('/network/services/42/restore', { reason: 'Payment received' })
  })

  it('disconnects a specific session', async () => {
    await sn.disconnectService(42, { session_id: 7 })
    expect(api.post).toHaveBeenCalledWith('/network/services/42/disconnect', { session_id: 7 })
  })

  it('sends a CoA to change bandwidth policy', async () => {
    await sn.sendServiceCoA(42, { download_speed: 2048, upload_speed: 1024, session_timeout: 3600 })
    expect(api.post).toHaveBeenCalledWith('/network/services/42/coa', {
      download_speed: 2048,
      upload_speed: 1024,
      session_timeout: 3600,
    })
  })
})
