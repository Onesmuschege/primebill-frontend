import api from './axiosInstance'

// Expenditures — operating costs (CRUD + categories + monthly summary).
// Responses are wrapped as { success, data, ... } — list rows live under `data`.

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

export const getExpenditures = (params = {}) => api.get('/expenditures', { params: clean(params) })
export const getExpenditure = (id) => api.get(`/expenditures/${id}`)
export const createExpenditure = (data) => api.post('/expenditures', data)
export const updateExpenditure = (id, data) => api.put(`/expenditures/${id}`, data)
export const deleteExpenditure = (id) => api.delete(`/expenditures/${id}`)
export const getExpenditureCategories = () => api.get('/expenditures/categories')
export const getExpenditureSummary = () => api.get('/expenditures/summary')