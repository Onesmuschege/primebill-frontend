import api from './axiosInstance'

export const getClients = async (params) => {
  const response = await api.get('/clients', { params })
  return response.data
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