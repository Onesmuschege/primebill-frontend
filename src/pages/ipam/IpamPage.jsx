import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getIpamSummary, getIpPools, createIpPool, deleteIpPool,
  getIpSubnets, createIpSubnet, deleteIpSubnet,
  getIpAllocations, createIpAllocation, releaseIpAllocation,
  getIpReservations, createIpReservation, deleteIpReservation,
  getDhcpPools, createDhcpPool, getDhcpLeases,
  getVlans, createVlan, deleteVlan,
} from '../../api/ipam.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'summary', label: 'Overview' },
  { key: 'pools',   label: 'IP Pools' },
  { key: 'subnets', label: 'Subnets' },
  { key: 'alloc',   label: 'Allocations' },
  { key: 'reserve', label: 'Reservations' },
  { key: 'dhcp',    label: 'DHCP' },
  { key: 'vlans',   label: 'VLANs' },
]

const EMPTY = {
  pools: { name: '', family: 'ipv4', network: '', prefix: 24, gateway: '', dns_primary: '', dns_secondary: '', is_public: false, status: 'active', description: '' },
  subnets: { name: '', ip_pool_id: '', network: '', netmask: '', gateway: '' },
  alloc: { ip_address: '', subnet_id: '', client_id: '', note: '' },
  reserve: { ip_address: '', mac_address: '', hostname: '', description: '' },
  vlans: { vlan_id: '', name: '', description: '', status: 'active' },
  dhcp: { name: '', subnet: '', start_ip: '', end_ip: '', router_id: '' },
}

const renderVal = (v) => {
  if (v === true) return 'Yes'
  if (v === false) return 'No'
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'object') return String(v)
  return String(v)
}

export default function IpamPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('summary')
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY.pools)

    const list = async (fn) => {
    const res = await fn({ per_page: 50, search: search || undefined })
    return Array.isArray(res?.data) ? res.data : []
  }

  const summary = useQuery({
    queryKey: ['ipam', 'summary'],
        queryFn: () => getIpamSummary(),
    enabled: tab === 'summary',
  })
  const pools = useQuery({ queryKey: ['ipam', 'pools', search], queryFn: () => list(getIpPools), enabled: tab === 'pools' })
  const subnets = useQuery({ queryKey: ['ipam', 'subnets', search], queryFn: () => list(getIpSubnets), enabled: tab === 'subnets' })
  const allocations = useQuery({ queryKey: ['ipam', 'alloc', search], queryFn: () => list(getIpAllocations), enabled: tab === 'alloc' })
  const reservations = useQuery({ queryKey: ['ipam', 'reserve'], queryFn: () => list(getIpReservations), enabled: tab === 'reserve' })
  const dhcpPools = useQuery({ queryKey: ['ipam', 'dhcp-pools'], queryFn: () => list(getDhcpPools), enabled: tab === 'dhcp' })
  const dhcpLeases = useQuery({ queryKey: ['ipam', 'dhcp-leases'], queryFn: () => list(getDhcpLeases), enabled: tab === 'dhcp' })
  const vlans = useQuery({ queryKey: ['ipam', 'vlans', search], queryFn: () => list(getVlans), enabled: tab === 'vlans' })

  const creator = {
    pools: createIpPool, subnets: createIpSubnet, alloc: createIpAllocation,
    reserve: createIpReservation, vlans: createVlan, default: createDhcpPool,
  }
  const create = useMutation({
    mutationFn: (payload) => (creator[tab] || creator.default)(payload),
    onSuccess: () => { toast.success('Created'); setModal(false); qc.invalidateQueries(['ipam']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Create failed'),
  })
  const del = {
    pools: deleteIpPool, subnets: deleteIpSubnet, reserve: deleteIpReservation, vlans: deleteVlan,
  }
  const mutateDelete = useMutation({
    mutationFn: ({ id }) => (del[tab] || (() => Promise.reject(new Error('Unsupported'))))(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['ipam']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  })
  const release = useMutation({
    mutationFn: (id) => releaseIpAllocation(id),
    onSuccess: () => { toast.success('Allocation released'); qc.invalidateQueries(['ipam']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Release failed'),
  })

  const cols = (arr) => {
    const sample = (Array.isArray(arr) ? arr[0] : null) || {}
    return Object.keys(sample)
      .filter((k) => !['tenant_id', 'updated_at', 'pivot'].includes(k))
      .slice(0, 8)
      .map((k) => ({
        key: k,
        label: k.replace(/_/g, ' '),
        render: (row) => (k === 'status' ? <Badge label={row[k] ?? '—'} variant={row[k] === 'active' ? 'active' : 'inactive'} /> : <span>{renderVal(row[k])}</span>),
      }))
  }
  const detailTitle = detail?.name || detail?.ip_address || (detail?.id ? `#${detail.id}` : '')

return (
    <div className="space-y-5">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">IP Address Management (IPAM)</h2>
            <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Subnets, pools, allocations, VLANs and DHCP</p>
          </div>
          {tab !== 'summary' && (
            <div className="flex items-center gap-2">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="input text-sm" />
              <button onClick={() => { setForm(EMPTY[tab] || EMPTY.pools); setModal(true) }} className="px-3 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#2563eb' }}>+ New</button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {TABS.map((t) => (
            <button key={t.key} onClick={() => { setTab(t.key); setSearch('') }} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${tab === t.key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'summary' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {summary.isLoading && <Spinner />}
          {!summary.isLoading && summary.data && [
            { label: 'IP Pools', value: summary.data.pools, color: '#2563eb' },
            { label: 'Subnets', value: summary.data.subnets, color: '#06b6d4' },
            { label: 'Allocated', value: summary.data.allocated, color: '#10b981' },
            { label: 'Reserved', value: summary.data.reserved, color: '#f59e0b' },
            { label: 'VLANs', value: summary.data.vlans, color: '#8b5cf6' },
            { label: 'Active DHCP Leases', value: summary.data.active_dhcp_leases, color: '#ec4899' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value ?? 0}</div>
              <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'pools' && <ListTable loading={pools.isLoading} data={pools.data} empty="No IP pools found" cols={cols(pools.data)} onRow={(r) => setDetail(r)} />}
      {tab === 'subnets' && <ListTable loading={subnets.isLoading} data={subnets.data} empty="No subnets found" cols={cols(subnets.data)} onRow={(r) => setDetail(r)} />}
      {tab === 'alloc' && <ListTable loading={allocations.isLoading} data={allocations.data} empty="No allocations found" cols={cols(allocations.data)} onRow={(r) => setDetail(r)} />}
      {tab === 'reserve' && <ListTable loading={reservations.isLoading} data={reservations.data} empty="No reservations found" cols={cols(reservations.data)} onRow={(r) => setDetail(r)} />}
      {tab === 'vlans' && <ListTable loading={vlans.isLoading} data={vlans.data} empty="No VLANs found" cols={cols(vlans.data)} onRow={(r) => setDetail(r)} />}
      {tab === 'dhcp' && (
        <div className="space-y-5">
          <ListTable loading={dhcpPools.isLoading} data={dhcpPools.data} empty="No DHCP pools found" cols={cols(dhcpPools.data)} onRow={(r) => setDetail(r)} />
          <ListTable loading={dhcpLeases.isLoading} data={dhcpLeases.data} empty="No leases found" cols={cols(dhcpLeases.data)} onRow={(r) => setDetail(r)} />
        </div>
      )}

      <Modal isOpen={!!modal} onClose={() => setModal(false)} title={`New ${String(tab).replace(/_/g, ' ')}`} size="md">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form) }} className="space-y-3">
          {Object.keys(EMPTY[tab] || EMPTY.pools).map((k) => (
            <div key={k}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>{k.replace(/_/g, ' ')}</label>
              <input
                value={typeof form[k] === 'boolean' ? (form[k] ? 'true' : 'false') : (form[k] ?? '')}
                onChange={(e) => {
                  let v = e.target.value
                  if (typeof form[k] === 'boolean') v = e.target.value === 'true'
                  if (typeof form[k] === 'number') v = e.target.value === '' ? '' : Number(e.target.value)
                  setForm({ ...form, [k]: v })
                }}
                className="input text-sm"
              />
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={create.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#2563eb' }}>{create.isPending ? 'Creating…' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`IPAM · ${detailTitle}`}>
        {detail && (
          <div className="space-y-1.5 text-sm">
            {Object.entries(detail).filter(([k]) => !['tenant_id'].includes(k)).map(([k, v]) => (
              <div key={k} className="flex gap-2 border-b border-gray-100 pb-1.5">
                <span className="w-32 shrink-0 font-medium" style={{ color: 'var(--pb-text-2)' }}>{k}</span>
                <span className="break-all">{v && typeof v === 'object' ? JSON.stringify(v) : renderVal(v)}</span>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-3">
              {tab === 'alloc' && detail.id && (
                <button onClick={() => { if (window.confirm('Release this allocation?')) release.mutate(detail.id) }} className="px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#f59e0b' }}>Release</button>
              )}
              {['pools', 'subnets', 'reserve', 'vlans'].includes(tab) && detail.id && (
                <button onClick={() => { if (window.confirm('Delete this item?')) mutateDelete.mutate({ id: detail.id }) }} className="px-3 py-2 rounded-lg text-sm text-white" style={{ background: '#dc2626' }}>Delete</button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function ListTable({ loading, data, empty, cols, onRow }) {
  return (
    <div className="card p-0 overflow-hidden">
      <Table loading={loading} data={data || []} emptyMessage={empty} onRowClick={onRow} columns={cols} />
    </div>
  )
}