import api, { unwrapList, unwrapOne } from './axiosInstance'

// Expenditures — operating costs (CRUD + categories + monthly summary).
// Responses are wrapped as { success, data, ... } — list rows live under `data`.

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getExpenditures = (params = {}) => api.get('/expenditures', { params: clean(params) }).then(unwrapList)
export const getExpenditure = (id) => api.get(`/expenditures/${id}`).then(unwrapOne)
export const createExpenditure = (data) => api.post('/expenditures', data).then(unwrapOne)
export const updateExpenditure = (id, data) => api.put(`/expenditures/${id}`, data).then(unwrapOne)
export const deleteExpenditure = (id) => api.delete(`/expenditures/${id}`).then(unwrapOne)
export const getExpenditureCategories = () => api.get('/expenditures/categories').then(unwrapList)
export const getExpenditureSummary = () => api.get('/expenditures/summary').then(unwrapOne)