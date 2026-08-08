import api, { unwrapList } from './axiosInstance'

export const getClients = async (params) => {
  const response = await api.get('/clients', { params })
  return unwrapList(response)          // ✅ returns { data: [], meta: {} }
}

export const getClient = async (id) => {
  const response = await api.get(`/clients/${id}`)
  return response.data
}

export const createClient = async (data) => {
  const response = await api.post('/clients', data)
  return response.data
}

export const updateClient = async (id, data) => {
  const response = await api.put(`/clients/${id}`, data)
  return response.data
}

export const deleteClient = async (id) => {
  const response = await api.delete(`/clients/${id}`)
  return response.data
}

export const suspendClient = async (id) => {
  const response = await api.post(`/clients/${id}/suspend`)
  return response.data
}

export const activateClient = async (id) => {
  const response = await api.post(`/clients/${id}/activate`)
  return response.data
}

export const getClientAccounts = async (id) => {
  const response = await api.get(`/clients/${id}/accounts`)
  return response.data
}

export const getClientInvoices = async (id) => {
  const response = await api.get(`/clients/${id}/invoices`)
  return response.data
}

export const getClientPayments = async (id) => {
  const response = await api.get(`/clients/${id}/payments`)
  return response.data
}

export const getClientTickets = async (id) => {
  const response = await api.get(`/clients/${id}/tickets`)
  return response.data
}

export const createClientAccount = async (clientId, data) => {
  const response = await api.post(`/clients/${clientId}/accounts`, data)
  return response.data
}

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
