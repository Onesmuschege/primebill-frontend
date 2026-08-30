import api, { unwrapList, unwrapOne } from './axiosInstance'

// RADIUS settings are managed under /settings/radius (RadiusSettingsController)
export const getRadiusSettings = () => api.get('/settings/radius').then(unwrapOne)
export const testRadiusConnection = () =>
  api.post('/settings/radius/test').then((res) => ({
    result: unwrapOne(res),
    message: res.data?.message,
  }))

// RADIUS sessions & sync
export const getRadiusSessions = (params) => api.get('/radius/sessions', { params }).then(unwrapList)
export const getRadiusStats    = () => api.get('/radius/stats').then(unwrapOne)
export const syncRadius        = () => api.post('/radius/sync').then(unwrapOne)
