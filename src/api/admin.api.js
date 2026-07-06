import api from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, v]) => v !== '' && v !== null && v !== undefined
    )
  )

/* ===========================
   Users
=========================== */

export const getAdminUsers = (params) =>
  api.get('/admin/users', { params: clean(params) })

export const createAdminUser = (data) =>
  api.post('/admin/users', data)

export const updateAdminUser = (id, data) =>
  api.put(`/admin/users/${id}`, data)

export const deleteAdminUser = (id) =>
  api.delete(`/admin/users/${id}`)

/* ===========================
   Roles
=========================== */

export const getAdminRoles = () =>
  api.get('/admin/roles')

export const createAdminRole = (data) =>
  api.post('/admin/roles', data)

export const updateAdminRole = (id, data) =>
  api.put(`/admin/roles/${id}`, data)

export const syncRolePermissions = (roleId, data) =>
  api.put(`/admin/roles/${roleId}`, data)

/* ===========================
   Permissions
=========================== */

export const getAdminPermissions = () =>
  api.get('/admin/roles/permissions')

/* ===================================================
   Aliases for newer frontend components
=================================================== */

export const getUsers = getAdminUsers
export const createUser = createAdminUser
export const updateUser = updateAdminUser
export const deleteUser = deleteAdminUser

export const getRoles = getAdminRoles
export const createRole = createAdminRole
export const updateRole = updateAdminRole

export const getPermissions = getAdminPermissions