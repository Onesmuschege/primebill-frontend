import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as expenditures from '../expenditures.api'
import * as incidents from '../incidents.api'
import * as security from '../security.api'
import * as mfa from '../mfa.api'

vi.mock('../axiosInstance', () => {
  const mockApi = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  }
  const unwrapList = (response) => {
    const body = response?.data
    if (Array.isArray(body)) return { data: body, meta: {} }
    if (body && Array.isArray(body.data)) return { data: body.data, meta: body.meta || {} }
    if (body && body.data && Array.isArray(body.data.data)) {
      return { data: body.data.data, meta: body.data.meta || {} }
    }
    return { data: [], meta: {} }
  }
  const unwrapOne = (response) => {
    const body = response?.data
    if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
      return body.data
    }
    return body
  }
  return { default: mockApi, unwrapList, unwrapOne }
})

describe('expenditures.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists expenditures with params', async () => {
    await expenditures.getExpenditures({ page: 1, per_page: 20 })
    expect(api.get).toHaveBeenCalledWith('/expenditures', { params: { page: 1, per_page: 20 } })
  })
  it('creates and updates an expenditure', async () => {
    await expenditures.createExpenditure({ description: 'Power bill', amount: 1200, category: 'Utilities' })
    expect(api.post).toHaveBeenCalledWith('/expenditures', {
      description: 'Power bill', amount: 1200, category: 'Utilities',
    })
    await expenditures.updateExpenditure(3, { amount: 1500 })
    expect(api.put).toHaveBeenCalledWith('/expenditures/3', { amount: 1500 })
  })
  it('deletes an expenditure', async () => {
    await expenditures.deleteExpenditure(4)
    expect(api.delete).toHaveBeenCalledWith('/expenditures/4')
  })
  it('fetches categories and summary', async () => {
    await expenditures.getExpenditureCategories()
    expect(api.get).toHaveBeenCalledWith('/expenditures/categories')
    await expenditures.getExpenditureSummary()
    expect(api.get).toHaveBeenCalledWith('/expenditures/summary')
  })
})

describe('incidents.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists incidents with filters', async () => {
    await incidents.getIncidents({ status: 'open', severity: 'critical', page: 1 })
    expect(api.get).toHaveBeenCalledWith('/incidents', {
      params: { status: 'open', severity: 'critical', page: 1 },
    })
  })
  it('creates an incident', async () => {
    await incidents.createIncident({ title: 'Outage', severity: 'high' })
    expect(api.post).toHaveBeenCalledWith('/incidents', { title: 'Outage', severity: 'high' })
  })
  it('acknowledges and resolves an incident', async () => {
    await incidents.acknowledgeIncident(7)
    expect(api.post).toHaveBeenCalledWith('/incidents/7/acknowledge')
    await incidents.resolveIncident(7, { root_cause: 'fe', resolution: 'done' })
    expect(api.post).toHaveBeenCalledWith('/incidents/7/resolve', { root_cause: 'fe', resolution: 'done' })
  })
  it('updates status and fetches stats', async () => {
    await incidents.updateIncidentStatus(7, 'resolved')
    expect(api.post).toHaveBeenCalledWith('/incidents/7/status', { status: 'resolved' })
    await incidents.getIncidentStats()
    expect(api.get).toHaveBeenCalledWith('/incidents/stats')
  })
})

describe('security.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists, creates and revokes api keys', async () => {
    await security.getApiKeys()
    expect(api.get).toHaveBeenCalledWith('/api-keys')
    await security.createApiKey({ name: 'CI', scopes: ['read'] })
    expect(api.post).toHaveBeenCalledWith('/api-keys', { name: 'CI', scopes: ['read'] })
    await security.revokeApiKey(10)
    expect(api.delete).toHaveBeenCalledWith('/api-keys/10')
  })
  it('lists and revokes sessions', async () => {
    await security.getSessions()
    expect(api.get).toHaveBeenCalledWith('/sessions')
    await security.revokeSession(4)
    expect(api.delete).toHaveBeenCalledWith('/sessions/4')
  })
  it('fetches login history and security events', async () => {
    await security.getLoginHistory({ from: '2026-01-01' })
    expect(api.get).toHaveBeenCalledWith('/login-history', { params: { from: '2026-01-01' } })
    await security.getSecurityEvents()
    expect(api.get).toHaveBeenCalledWith('/login-history/security-events', { params: {} })
  })
})

describe('mfa.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('challenges with the short-lived mfa_token as an explicit Bearer header', async () => {
    await mfa.challengeMfa('mfa-token-123', '123456')
    expect(api.post).toHaveBeenCalledWith('/mfa/challenge', { code: '123456' }, {
      headers: { Authorization: 'Bearer mfa-token-123' },
    })
  })
  it('enables and disables mfa', async () => {
    await mfa.enableMfa('123456')
    expect(api.post).toHaveBeenCalledWith('/mfa/enable', { code: '123456' })
    await mfa.disableMfa('password')
    expect(api.post).toHaveBeenCalledWith('/mfa/disable', { password: 'password' })
  })
})