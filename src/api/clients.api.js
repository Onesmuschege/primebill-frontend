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
export const getClientNotes = (clientId, params) =>
  api.get(`/clients/${clientId}/notes`, { params }).then(unwrapList)

export const createClientNote = (clientId, data) =>
  api.post(`/clients/${clientId}/notes`, data).then(unwrapOne)

export const toggleNotePin = (clientId, noteId) =>
  api.post(`/clients/${clientId}/notes/${noteId}/pin`).then(unwrapOne)

// CRM — Tags
export const getClientTags = (clientId) =>
  api.get(`/clients/${clientId}/tags`).then(unwrapList)

export const assignTagToClient = (clientId, clientTagId) =>
  api.post(`/clients/${clientId}/tags/assign`, { client_tag_id: clientTagId }).then(unwrapOne)

export const removeTagFromClient = (clientId, tagId) =>
  api.delete(`/clients/${clientId}/tags/remove`, {
    data: { client_tag_id: tagId },
  }).then(unwrapOne)

// CRM — Custom Fields
export const getClientCustomFieldValues = (clientId) =>
  api.get(`/clients/${clientId}/custom-fields`).then(unwrapOne)

export const updateClientCustomFieldValues = (clientId, values) =>
  api.put(`/clients/${clientId}/custom-fields`, { values }).then(unwrapOne)
