import api from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getAdminUsers = (params) => api.get('/admin/users', { params: clean(params) })
export const createAdminUser = (data) => api.post('/admin/users', data)
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data)
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`)

export const getAdminRoles = () => api.get('/admin/roles')
export const getAdminPermissions = () => api.get('/admin/permissions')
export const createAdminRole = (data) => api.post('/admin/roles', data)
export const updateAdminRole = (id, data) => api.put(`/admin/roles/${id}`, data)
