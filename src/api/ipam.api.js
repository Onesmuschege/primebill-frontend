import api from './axiosInstance'

// IPAM — IP address management. Response unwrapping centralized here.
const unwrapList = (p) => p.then((r) => {
  const body = r.data?.data ?? r.data
  return { data: body?.data ?? [], meta: body?.meta ?? body ?? {} }
})
const unwrapOne = (p) => p.then((r) => r.data?.data ?? r.data)

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// ── Summary ─
export const getIpamSummary = () => unwrapOne(api.get('/ipam/summary'))

// ── Pools ─
export const getIpPools = (params = {}) => unwrapList(api.get('/ipam/pools', { params: clean(params) }))
export const createIpPool = (data) => unwrapOne(api.post('/ipam/pools', data))
export const getIpPool = (id) => unwrapOne(api.get(`/ipam/pools/${id}`))
export const updateIpPool = (id, data) => unwrapOne(api.put(`/ipam/pools/${id}`, data))
export const deleteIpPool = (id) => unwrapOne(api.delete(`/ipam/pools/${id}`))

// ── Subnets ─
export const getIpSubnets = (params = {}) => unwrapList(api.get('/ipam/subnets', { params: clean(params) }))
export const createIpSubnet = (data) => unwrapOne(api.post('/ipam/subnets', data))
export const getIpSubnet = (id) => unwrapOne(api.get(`/ipam/subnets/${id}`))
export const updateIpSubnet = (id, data) => unwrapOne(api.put(`/ipam/subnets/${id}`, data))
export const deleteIpSubnet = (id) => unwrapOne(api.delete(`/ipam/subnets/${id}`))

// ── Allocations ─
export const getIpAllocations = (params = {}) => unwrapList(api.get('/ipam/allocations', { params: clean(params) }))
export const createIpAllocation = (data) => unwrapOne(api.post('/ipam/allocations', data))
export const getAllocationHistory = (id) => unwrapList(api.get(`/ipam/allocations/${id}/history`))
export const releaseIpAllocation = (id) => unwrapOne(api.post(`/ipam/allocations/${id}/release`))

// ── Reservations ─
export const getIpReservations = (params = {}) => unwrapList(api.get('/ipam/reservations', { params: clean(params) }))
export const createIpReservation = (data) => unwrapOne(api.post('/ipam/reservations', data))
export const deleteIpReservation = (id) => unwrapOne(api.delete(`/ipam/reservations/${id}`))

// ── DHCP ─
export const getDhcpPools = (params = {}) => unwrapList(api.get('/ipam/dhcp/pools', { params: clean(params) }))
export const createDhcpPool = (data) => unwrapOne(api.post('/ipam/dhcp/pools', data))
export const getDhcpLeases = (params = {}) => unwrapList(api.get('/ipam/dhcp/leases', { params: clean(params) }))
export const createDhcpLease = (data) => unwrapOne(api.post('/ipam/dhcp/leases', data))

// ── VLANs ─
export const getVlans = (params = {}) => unwrapList(api.get('/ipam/vlans', { params: clean(params) }))
export const createVlan = (data) => unwrapOne(api.post('/ipam/vlans', data))
export const getVlan = (id) => unwrapOne(api.get(`/ipam/vlans/${id}`))
export const updateVlan = (id, data) => unwrapOne(api.put(`/ipam/vlans/${id}`, data))
export const deleteVlan = (id) => unwrapOne(api.delete(`/ipam/vlans/${id}`))
export const assignVlan = (data) => unwrapOne(api.post('/ipam/vlans/assign', data))
