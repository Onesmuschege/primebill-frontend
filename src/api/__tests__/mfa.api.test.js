import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as mfa from '../mfa.api'

vi.mock('../axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

describe('mfa.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('generates a secret and enables mfa with a 6-digit code', async () => {
    await mfa.generateMfaSecret()
    expect(api.post).toHaveBeenCalledWith('/mfa/generate')
    await mfa.enableMfa('123456')
    expect(api.post).toHaveBeenCalledWith('/mfa/enable', { code: '123456' })
  })

  it('disables mfa with the password', async () => {
    await mfa.disableMfa('correct-password')
    expect(api.post).toHaveBeenCalledWith('/mfa/disable', { password: 'correct-password' })
  })

  it('regenerates backup codes only with a verification code (no body bug)', async () => {
    await mfa.regenerateBackupCodes('123456')
    expect(api.post).toHaveBeenCalledWith('/mfa/backup-codes', { code: '123456' })
  })

  it('fetches mfa status and device-verifies a code', async () => {
    await mfa.getMfaStatus()
    expect(api.get).toHaveBeenCalledWith('/mfa/status')
    await mfa.verifyMfaCode('123456')
    expect(api.post).toHaveBeenCalledWith('/mfa/verify', { code: '123456' })
  })
})
