import api, { unwrapList } from './axiosInstance'

// ─── Leads ────────────────────────────────────────────────────────────────

export const getLeads = async (params) => {
  const response = await api.get('/leads', { params })
  return unwrapList(response)
}

export const getLeadStats = async () => {
  const response = await api.get('/leads/stats')
  return response.data
}

export const getLead = async (id) => {
  const response = await api.get(`/leads/${id}`)
  return response.data
}

export const createLead = async (data) => {
  const response = await api.post('/leads', data)
  return response.data
}

export const updateLead = async (id, data) => {
  const response = await api.put(`/leads/${id}`, data)
  return response.data
}

export const deleteLead = async (id) => {
  const response = await api.delete(`/leads/${id}`)
  return response.data
}

export const convertLeadToProspect = async (id, data) => {
  const response = await api.post(`/leads/${id}/convert`, data)
  return response.data
}

export const markLeadAsLost = async (id, lostReason) => {
  const response = await api.post(`/leads/${id}/lost`, { lost_reason: lostReason })
  return response.data
}

// ─── Prospects ────────────────────────────────────────────────────────────

export const getProspects = async (params) => {
  const response = await api.get('/prospects', { params })
  return unwrapList(response)
}

export const getProspectStats = async () => {
  const response = await api.get('/prospects/stats')
  return response.data
}

export const getProspect = async (id) => {
  const response = await api.get(`/prospects/${id}`)
  return response.data
}

export const createProspect = async (data) => {
  const response = await api.post('/prospects', data)
  return response.data
}

export const updateProspect = async (id, data) => {
  const response = await api.put(`/prospects/${id}`, data)
  return response.data
}

export const deleteProspect = async (id) => {
  const response = await api.delete(`/prospects/${id}`)
  return response.data
}

export const advanceProspect = async (id, pipelineStage) => {
  const response = await api.post(`/prospects/${id}/advance`, { pipeline_stage: pipelineStage })
  return response.data
}

export const markProspectAsWon = async (id, clientId) => {
  const response = await api.post(`/prospects/${id}/won`, { client_id: clientId })
  return response.data
}

export const markProspectAsLost = async (id, lostReason) => {
  const response = await api.post(`/prospects/${id}/lost`, { lost_reason: lostReason })
  return response.data
}