import api, { unwrapList, unwrapOne } from './axiosInstance'

// ─── Leads ────────────────────────────────────────────────────────────────

export const getLeads = async (params) => {
  const response = await api.get('/leads', { params })
  return unwrapList(response)
}

export const getLeadStats = async () => {
  const response = await api.get('/leads/stats')
  return response.data
}

export const getLead = (id) => api.get(`/leads/${id}`).then(unwrapOne)

export const createLead = (data) => api.post('/leads', data).then(unwrapOne)

export const updateLead = (id, data) => api.put(`/leads/${id}`, data).then(unwrapOne)

export const deleteLead = (id) => api.delete(`/leads/${id}`).then(unwrapOne)

export const convertLeadToProspect = (id, data) =>
  api.post(`/leads/${id}/convert`, data).then(unwrapOne)

export const markLeadAsLost = (id, lostReason) =>
  api.post(`/leads/${id}/lost`, { lost_reason: lostReason }).then(unwrapOne)

// ─── Prospects ────────────────────────────────────────────────────────────

export const getProspects = async (params) => {
  const response = await api.get('/prospects', { params })
  return unwrapList(response)
}

export const getProspectStats = async () => {
  const response = await api.get('/prospects/stats')
  return response.data
}

export const getProspect = (id) => api.get(`/prospects/${id}`).then(unwrapOne)

export const createProspect = (data) => api.post('/prospects', data).then(unwrapOne)

export const updateProspect = (id, data) => api.put(`/prospects/${id}`, data).then(unwrapOne)

export const deleteProspect = (id) => api.delete(`/prospects/${id}`).then(unwrapOne)

export const advanceProspect = (id, pipelineStage) =>
  api.post(`/prospects/${id}/advance`, { pipeline_stage: pipelineStage }).then(unwrapOne)

export const markProspectAsWon = (id, clientId) =>
  api.post(`/prospects/${id}/won`, { client_id: clientId }).then(unwrapOne)

export const markProspectAsLost = (id, lostReason) =>
  api.post(`/prospects/${id}/lost`, { lost_reason: lostReason }).then(unwrapOne)