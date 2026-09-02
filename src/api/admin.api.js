import api, { unwrapList, unwrapOne } from './axiosInstance'

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
  api.get('/admin/users', { params: clean(params) }).then(unwrapList)

export const createAdminUser = (data) =>
  api.post('/admin/users', data).then(unwrapOne)

export const updateAdminUser = (id, data) =>
  api.put(`/admin/users/${id}`, data).then(unwrapOne)

export const deleteAdminUser = (id) =>
  api.delete(`/admin/users/${id}`).then(unwrapOne)

/* ===========================
   Roles
=========================== */

export const getAdminRoles = () =>
  api.get('/admin/roles').then(unwrapList)

export const createAdminRole = (data) =>
  api.post('/admin/roles', data).then(unwrapOne)

export const updateAdminRole = (id, data) =>
  api.put(`/admin/roles/${id}`, data).then(unwrapOne)

export const syncRolePermissions = (roleId, data) =>
  api.put(`/admin/roles/${roleId}`, data).then(unwrapOne)

/* ===========================
   Permissions
=========================== */

export const getAdminPermissions = () =>
  api.get('/admin/roles/permissions').then(unwrapList)

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