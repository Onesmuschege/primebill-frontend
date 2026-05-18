import api from './axiosInstance'

export const login          = (credentials)  => api.post('/auth/login', credentials)
export const logout         = ()             => api.post('/auth/logout')
export const getMe          = ()             => api.get('/auth/me')
export const changePassword = (data)         => api.post('/auth/change-password', data)
export const forgotPassword = (data)         => api.post('/auth/forgot-password', data)
export const resetPassword  = (data)         => api.post('/auth/reset-password', data)