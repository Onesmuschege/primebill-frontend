import api from './axiosInstance'

export const login          = (credentials)  => api.post('/auth/login', credentials)
export const logout         = ()             => api.post('/auth/logout')
export const getMe          = ()             => api.get('/auth/me')
export const changePassword = (data)         => api.post('/auth/change-password', data)
export const forgotPassword = (data)         => api.post('/auth/password/forgot', data)
export const resetPassword  = (data)         => api.post('/auth/password/reset', data)
export const registerTenant = (data)         => api.post('/tenants/register', data)
export const checkTenantSlug = (name)        => api.get('/tenants/check-slug', { params: { name } })