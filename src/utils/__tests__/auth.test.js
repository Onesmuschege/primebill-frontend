import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import api, { SESSION_EXPIRED_EVENT } from '../../api/axiosInstance'
import { challengeMfa } from '../../api/mfa.api'

// These tests exercise the REAL axios interceptor (not a mock) so they guard the
// authentication-critical guarantees documented in AuthContext / axiosInstance:
//
//   1. A deliberately-provided Authorization header (e.g. the short-lived
//      mfa_token for /mfa/challenge) is NEVER overwritten by a stale
//      localStorage session token.
//   2. When no explicit header is supplied, the interceptor attaches the
//      localStorage Bearer token as usual (normal authenticated sessions).
//   3. challengeMfa() sends the MFA-pending token, not the session token.

function captureNext(configHolder) {
  api.defaults.adapter = async (config) => {
    Object.assign(configHolder, config)
    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  }
}

describe('Authentication token handling (axios interceptor)', () => {
  let captured

  beforeEach(() => {
    captured = {}
    captureNext(captured)
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
    delete api.defaults.adapter
  })

  it('preserves an explicit mfa_token Authorization header even when a stale session token exists', async () => {
    // Simulate a lingering session token from a previous login while MFA is detected.
    localStorage.setItem('token', 'stale-session-token')

    await challengeMfa('pending-mfa-token', '123456')

    // The mfa_token must be the credential sent — never the stale session token.
    expect(captured.headers?.Authorization).toBe('Bearer pending-mfa-token')
    expect(captured.url).toBe('/mfa/challenge')
  })

  it('attaches the localStorage Bearer token when no explicit header is provided', async () => {
    localStorage.setItem('token', 'session-token-abc')

    await api.get('/clients')

    expect(captured.headers?.Authorization).toBe('Bearer session-token-abc')
  })

  it('does not attach any Authorization header when there is no token and none is provided', async () => {
    await api.get('/clients')
    expect(captured.headers?.Authorization).toBeUndefined()
  })

  it('dispatches the session-expired event on a 401 for a guarded endpoint', async () => {
    let fired = false
    const handler = () => { fired = true }
    window.addEventListener(SESSION_EXPIRED_EVENT, handler)

    api.defaults.adapter = async (config) => {
      const err = new Error('Unauthorized')
      err.config = config
      err.response = { status: 401, data: {} }
      throw err
    }

    await expect(api.get('/routers')).rejects.toThrow()
    expect(fired).toBe(true)
    window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
    api.defaults.adapter = undefined
  })
})