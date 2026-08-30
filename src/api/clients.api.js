import api, { unwrapList, unwrapOne } from './axiosInstance'

export const getClients = async (params) => {
  const response = await api.get('/clients', { params })
  return unwrapList(response)          // ✅ returns { data: [], meta: {} }
}

export const getClient = (id) => api.get(`/clients/${id}`).then(unwrapOne)

export const createClient = (data) => api.post('/clients', data).then(unwrapOne)

export const updateClient = (id, data) => api.put(`/clients/${id}`, data).then(unwrapOne)

export const deleteClient = (id) => api.delete(`/clients/${id}`).then(unwrapOne)

export const suspendClient = (id) => api.post(`/clients/${id}/suspend`).then(unwrapOne)

export const activateClient = (id) => api.post(`/clients/${id}/activate`).then(unwrapOne)

export const getClientAccounts = (id) => api.get(`/clients/${id}/accounts`).then(unwrapList)

export const getClientInvoices = (id) => api.get(`/clients/${id}/invoices`).then(unwrapList)

export const getClientPayments = (id) => api.get(`/clients/${id}/payments`).then(unwrapList)

export const getClientTickets = (id) => api.get(`/clients/${id}/tickets`).then(unwrapList)

export const createClientAccount = (clientId, data) =>
  api.post(`/clients/${clientId}/accounts`, data).then(unwrapOne)

// CRM — Notes
export const getClientNotes = async (clientId, params) => {
  const response = await api.get(`/clients/${clientId}/notes`, { params })
  return response.data
}

export const createClientNote = async (clientId, data) => {
  const response = await api.post(`/clients/${clientId}/notes`, data)
  return response.data
}

export const toggleNotePin = async (clientId, noteId) => {
  const response = await api.post(`/clients/${clientId}/notes/${noteId}/pin`)
  return response.data
}

// CRM — Tags
export const getClientTags = async (clientId) => {
  const response = await api.get(`/clients/${clientId}/tags`)
  return response.data
}

export const assignTagToClient = async (clientId, clientTagId) => {
  const response = await api.post(`/clients/${clientId}/tags/assign`, { client_tag_id: clientTagId })
  return response.data
}

export const removeTagFromClient = async (clientId, tagId) => {
  const response = await api.delete(`/clients/${clientId}/tags/remove`, {
    data: { client_tag_id: tagId }
  })
  return response.data
}

// CRM — Custom Fields
export const getClientCustomFieldValues = async (clientId) => {
  const response = await api.get(`/clients/${clientId}/custom-fields`)
  return response.data
}

export const updateClientCustomFieldValues = async (clientId, values) => {
  const response = await api.put(`/clients/${clientId}/custom-fields`, { values })
  return response.data
}
