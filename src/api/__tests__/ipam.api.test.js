import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from '../axiosInstance'
import * as ipam from '../ipam.api'

vi.mock('../axiosInstance', () => {
  const mockApi = {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
  }
  return { default: mockApi }
})

describe('ipam.api', () => {
  beforeEach(() => vi.clearAllMocks())

  it('fetches the summary', async () => {
    await ipam.getIpamSummary()
    expect(api.get).toHaveBeenCalledWith('/ipam/summary')
  })

  it('lists ip pools with cleaned params', async () => {
    await ipam.getIpPools({ family: 'ipv4', search: '', status: 'active' })
    expect(api.get).toHaveBeenCalledWith('/ipam/pools', { params: { family: 'ipv4', status: 'active' } })
  })

  it('creates a subnet', async () => {
    const payload = { name: 'Mgmt', network: '192.168.1.0', prefix: 24 }
    await ipam.createIpSubnet(payload)
    expect(api.post).toHaveBeenCalledWith('/ipam/subnets', payload)
  })

  it('releases an allocation via POST', async () => {
    await ipam.releaseIpAllocation(5)
    expect(api.post).toHaveBeenCalledWith('/ipam/allocations/5/release')
  })

  it('creates a vlan and assigns it', async () => {
    await ipam.createVlan({ vlan_id: 100, name: 'Voice' })
    expect(api.post).toHaveBeenCalledWith('/ipam/vlans', { vlan_id: 100, name: 'Voice' })
    await ipam.assignVlan({ vlan_id: 100, assignable_type: 'App\\Models\\Router', assignable_id: 1 })
    expect(api.post).toHaveBeenCalledWith('/ipam/vlans/assign', {
      vlan_id: 100, assignable_type: 'App\\Models\\Router', assignable_id: 1,
    })
  })

  it('queries dhcp pools and leases', async () => {
    await ipam.getDhcpPools()
    expect(api.get).toHaveBeenCalledWith('/ipam/dhcp/pools', { params: {} })
    await ipam.getDhcpLeases()
    expect(api.get).toHaveBeenCalledWith('/ipam/dhcp/leases', { params: {} })
  })

  it('deletes a subnet', async () => {
    await ipam.deleteIpSubnet(9)
    expect(api.delete).toHaveBeenCalledWith('/ipam/subnets/9')
  })
})