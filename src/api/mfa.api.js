import api from './axiosInstance'

// MFA (TOTP / recovery codes) self-service.
//
// The login challenge flow deserves a note:
//   POST /auth/login     → { mfa_required: true, mfa_token, user } when the
//                          account has MFA enabled (no session token yet).
//   POST /mfa/challenge  → complete the login by sending the 6-digit TOTP or a
//                          backup code, authenticated with the short-lived
//                          `mfa_token` as the Bearer credential. On success
//                          returns the real session `token` + `user`.
// Because the mfa_token is NOT the session token, it must be sent explicitly as
// an Authorization header (the axiosInstance interceptor now honours an explicit
// Authorization header and never overwrites it with a stale localStorage token).

export const getMfaStatus = () => api.get('/mfa/status')
export const generateMfaSecret = () => api.post('/mfa/generate')
export const enableMfa = (code) => api.post('/mfa/enable', { code })
export const disableMfa = (password) => api.post('/mfa/disable', { password })
// Backup-code regeneration is a privileged action: the backend re-verifies the
// user's current TOTP code, so a stolen session alone cannot rotate the codes.
// (Previously this called POST /mfa/backup-codes with no body, which the
//  backend rejects with a 422 "code is required".)
export const regenerateBackupCodes = (code) => api.post('/mfa/backup-codes', { code })

// Challenge — completes a login that was paused for MFA (Bearer = mfa_token).
export const challengeMfa = (mfaToken, code) =>
  api.post('/mfa/challenge', { code }, { headers: { Authorization: `Bearer ${mfaToken}` } })

// Verify — device-level MFA confirmation for an already-authorized user.
export const verifyMfaCode = (code) => api.post('/mfa/verify', { code })