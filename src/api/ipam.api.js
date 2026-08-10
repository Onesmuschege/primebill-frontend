import api from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// ── Summary ─────────────────────────────────────────────────────────────
export const getIpamSummary = () => api.get('/ipam/summary')

// ── Pools ────────────────────────────────────────────────────────────────
export const getIpPools = (params = {}) => api.get('/ipam/pools', { params: clean(params) })
export const createIpPool = (data) => api.post('/ipam/pools', data)
export const getIpPool = (id) => api.get(`/ipam/pools/${id}`)
export const updateIpPool = (id, data) => api.put(`/ipam/pools/${id}`, data)
export const deleteIpPool = (id) => api.delete(`/ipam/pools/${id}`)

// ── Subnets ──────────────────────────────────────────────────────────────
export const getIpSubnets = (params = {}) => api.get('/ipam/subnets', { params: clean(params) })
export const createIpSubnet = (data) => api.post('/ipam/subnets', data)
export const getIpSubnet = (id) => api.get(`/ipam/subnets/${id}`)
export const updateIpSubnet = (id, data) => api.put(`/ipam/subnets/${id}`, data)
export const deleteIpSubnet = (id) => api.delete(`/ipam/subnets/${id}`)

// ── Allocations ──────────────────────────────────────────────────────────
export const getIpAllocations = (params = {}) => api.get('/ipam/allocations', { params: clean(params) })
export const createIpAllocation = (data) => api.post('/ipam/allocations', data)
export const getAllocationHistory = (id) => api.get(`/ipam/allocations/${id}/history`)
export const releaseIpAllocation = (id) => api.post(`/ipam/allocations/${id}/release`)
export const getIpReservations = (params = {}) => api.get('/ipam/reservations', { params: clean(params) })
export const createIpReservation = (data) => api.post('/ipam/reservations', data)
export const deleteIpReservation = (id) => api.delete(`/ipam/reservations/${id}`)

// ── DHCP ─────────────────────────────────────────────────────────────────
export const getDhcpPools = (params = {}) => api.get('/ipam/dhcp/pools', { params: clean(params) })
export const createDhcpPool = (data) => api.post('/ipam/dhcp/pools', data)
export const getDhcpLeases = (params = {}) => api.get('/ipam/dhcp/leases', { params: clean(params) })
export const createDhcpLease = (data) => api.post('/ipam/dhcp/leases', data)

// ── VLANs ────────────────────────────────────────────────────────────────
export const getVlans = (params = {}) => api.get('/ipam/vlans', { params: clean(params) })
export const createVlan = (data) => api.post('/ipam/vlans', data)
export const getVlan = (id) => api.get(`/ipam/vlans/${id}`)
export const updateVlan = (id, data) => api.put(`/ipam/vlans/${id}`, data)
export const deleteVlan = (id) => api.delete(`/ipam/vlans/${id}`)
export const assignVlan = (data) => api.post('/ipam/vlans/assign', data)