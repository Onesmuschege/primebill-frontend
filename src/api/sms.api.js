import api from './axiosInstance'

export const sendSms = (data) => api.post('/sms/send', data)
export const sendBulkSms = (data) => api.post('/sms/send-bulk', data)
export const getSmsLogs = (params) => api.get('/sms/logs', { params })
export const getSmsBalance = () => api.get('/sms/balance')
export const getSmsTemplates = () => api.get('/sms/templates')