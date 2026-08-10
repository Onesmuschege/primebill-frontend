import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../../api/axiosInstance'
import * as auth from '../../api/auth.api'

vi.mock('../../api/axiosInstance', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  },
}))

describe('auth.api (endpoint contract)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('login posts to /auth/login', async () => {
    await auth.login({ email: 'a@b.com', password: 'secret' })
    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'secret' })
  })

  it('forgot password posts to /auth/password/forgot (backend route)', async () => {
    await auth.forgotPassword({ email: 'a@b.com' })
    expect(api.post).toHaveBeenCalledWith('/auth/password/forgot', { email: 'a@b.com' })
  })

  it('reset password posts to /auth/password/reset (backend route)', async () => {
    await auth.resetPassword({ token: 't', email: 'a@b.com', password: 'newpass1', password_confirmation: 'newpass1' })
    expect(api.post).toHaveBeenCalledWith('/auth/password/reset', {
      token: 't', email: 'a@b.com', password: 'newpass1', password_confirmation: 'newpass1',
    })
  })

  it('me / change-password / logout hit the correct endpoints', async () => {
    await auth.getMe()
    expect(api.get).toHaveBeenCalledWith('/auth/me')
    await auth.changePassword({ current_password: 'old', new_password: 'newpass1', new_password_confirmation: 'newpass1' })
    expect(api.post).toHaveBeenCalledWith('/auth/change-password', {
      current_password: 'old', new_password: 'newpass1', new_password_confirmation: 'newpass1',
    })
    await auth.logout()
    expect(api.post).toHaveBeenCalledWith('/auth/logout')
  })

  it('tenant registration and slug check hit the correct endpoints', async () => {
    await auth.registerTenant({ name: 'Acme ISP', slug: 'acme' })
    expect(api.post).toHaveBeenCalledWith('/tenants/register', { name: 'Acme ISP', slug: 'acme' })
    await auth.checkTenantSlug('acme')
    expect(api.get).toHaveBeenCalledWith('/tenants/check-slug', { params: { name: 'acme' } })
  })
})
