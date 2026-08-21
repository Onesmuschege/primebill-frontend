import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api, { unwrapList } from '../../api/axiosInstance'
import { inventoryOperationsApi } from '../../api/inventory-operations.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { formatKES } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/formatDate'
import {
  Plus, Trash2, ArrowRightLeft, ShoppingCart, Check, Truck,
  PackageCheck, Ban, RotateCcw, Send, ClipboardCheck,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ---------------------------------------------------------------------------
// Status -> badge class + human label, and which actions are valid from that
// status. The backend (StockTransferService / PurchaseOrderService) is the
// real source of truth and will reject invalid transitions with a 422 — this
// map is just for deciding which buttons to show, not for enforcement.
// ---------------------------------------------------------------------------
const TRANSFER_STATUS = {
  draft:      { label: 'Draft',      badge: 'badge-pending',   actions: ['approve', 'cancel'] },
  approved:   { label: 'Approved',   badge: 'badge-info',      actions: ['dispatch', 'cancel'] },
  dispatched: { label: 'Dispatched', badge: 'badge-unpaid',    actions: ['receive'] },
  received:   { label: 'Received',   badge: 'badge-active',    actions: ['reverse'] },
  cancelled:  { label: 'Cancelled',  badge: 'badge-suspended', actions: [] },
  reversed:   { label: 'Reversed',   badge: 'badge-inactive',  actions: [] },
}

const PO_STATUS = {
  draft:               { label: 'Draft',               badge: 'badge-pending',   actions: ['submit', 'cancel'] },
  submitted:           { label: 'Submitted',            badge: 'badge-info',     actions: ['approve', 'cancel'] },
  approved:            { label: 'Approved',             badge: 'badge-unpaid',   actions: ['receive', 'cancel'] },
  partially_received:  { label: 'Partially Received',   badge: 'badge-unpaid',   actions: ['receive', 'complete'] },
  received:            { label: 'Received',             badge: 'badge-info',     actions: ['complete'] },
  completed:           { label: 'Completed',            badge: 'badge-active',   actions: [] },
  cancelled:           { label: 'Cancelled',             badge: 'badge-suspended', actions: [] },
}

function StatusBadge({ status, map }) {
  const cfg = map[status] || { label: status || '—', badge: 'badge-inactive' }
  return <span className={cfg.badge}>{cfg.label}</span>
}

// ── Item row picker shared by both create forms ─────────────────────────────
function ItemRows({ rows, setRows, items, withUnitCost }) {
  const updateRow = (i, patch) => {
    const next = [...rows]
    next[i] = { ...next[i], ...patch }
    setRows(next)
  }
  const addRow = () => setRows([...rows, { inventory_item_id: '', quantity: 1, unit_cost: '', notes: '' }])
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      <label className="label">Items *</label>
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <select
            value={row.inventory_item_id}
            onChange={(e) => updateRow(i, { inventory_item_id: e.target.value })}
            className="input flex-1"
            required
          >
            <option value="">Select item...</option>
            {items?.map(it => <option key={it.id} value={it.id}>{it.name}</option>)}
          </select>
          <input
            type="number" min="1" placeholder="Qty" value={row.quantity}
            onChange={(e) => updateRow(i, { quantity: e.target.value })}
            className="input w-24" required
          />
          {withUnitCost && (
            <input
              type="number" min="0" step="0.01" placeholder="Unit cost" value={row.unit_cost}
              onChange={(e) => updateRow(i, { unit_cost: e.target.value })}
              className="input w-32" required
            />
          )}
          <button type="button" onClick={() => removeRow(i)} disabled={rows.length === 1}
            className="p-2 rounded-lg disabled:opacity-30" style={{ color: '#f87171' }}>
            <Trash2 size={15} />
          </button>
        </div>
      ))}
      <button type="button" onClick={addRow} className="btn-secondary text-xs py-1.5">
        <Plus size={13} /> Add Line
      </button>
    </div>
  )
}

// ── Transfers tab ────────────────────────────────────────────────────────────
function TransfersTab({ items, warehouses }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ source_warehouse_id: '', destination_warehouse_id: '', expected_date: '', notes: '' })
  const [rows, setRows] = useState([{ inventory_item_id: '', quantity: 1, notes: '' }])

  const { data, isLoading } = useQuery({
    queryKey: ['stock-transfers', page],
    queryFn: () => inventoryOperationsApi.listTransfers({ page }).then(unwrapList),
  })

  const invalidate = () => {
    queryClient.invalidateQueries(['stock-transfers'])
    setDetail(null)
  }

  const createMutation = useMutation({
    mutationFn: (payload) => inventoryOperationsApi.createTransfer(payload),
    onSuccess: () => {
      toast.success('Draft transfer created')
      setShowCreate(false)
      setForm({ source_warehouse_id: '', destination_warehouse_id: '', expected_date: '', notes: '' })
      setRows([{ inventory_item_id: '', quantity: 1, notes: '' }])
      queryClient.invalidateQueries(['stock-transfers'])
    },
    onError: (err) => toast.error(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : err.response?.data?.message || 'Failed to create transfer'),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action, reason }) => {
      if (action === 'approve')  return inventoryOperationsApi.approveTransfer(id)
      if (action === 'dispatch') return inventoryOperationsApi.dispatchTransfer(id)
      if (action === 'receive')  return inventoryOperationsApi.receiveTransfer(id)
      if (action === 'cancel')   return inventoryOperationsApi.cancelTransfer(id, reason)
      if (action === 'reverse')  return inventoryOperationsApi.reverseTransfer(id, reason)
    },
    onSuccess: (_, { action }) => { toast.success(`Transfer ${action}d`); invalidate() },
    onError: (err) => toast.error(err.response?.data?.errors?.transfer || err.response?.data?.message || 'Action failed'),
  })

  const handleAction = (id, action) => {
    let reason
    if (['cancel', 'reverse'].includes(action)) {
      reason = window.prompt(`Reason for ${action} (optional):`) || undefined
    }
    actionMutation.mutate({ id, action, reason })
  }

  const columns = [
    { key: 'reference_number', label: 'Reference', render: (r) => <span className="font-medium">{r.reference_number || `#${r.id}`}</span> },
    { key: 'route', label: 'Route', render: (r) => (
      <span className="flex items-center gap-1.5 text-sm">
        {r.source_warehouse?.name || '—'} <ArrowRightLeft size={12} style={{ color: 'var(--pb-text-3)' }} /> {r.destination_warehouse?.name || '—'}
      </span>
    )},
    { key: 'items_count', label: 'Items', render: (r) => r.items?.length ?? r.items_count ?? '—' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} map={TRANSFER_STATUS} /> },
    { key: 'created_at', label: 'Created', render: (r) => formatDate(r.created_at) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New Transfer
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} onRowClick={setDetail} emptyMessage="No stock transfers yet." />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Stock Transfer" size="lg">
        <form onSubmit={(e) => {
          e.preventDefault()
          createMutation.mutate({
            ...form,
            items: rows.map(r => ({ inventory_item_id: r.inventory_item_id, quantity: Number(r.quantity), notes: r.notes || undefined })),
          })
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Source Warehouse *</label>
              <select value={form.source_warehouse_id} onChange={(e) => setForm({ ...form, source_warehouse_id: e.target.value })} className="input" required>
                <option value="">Select...</option>
                {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Destination Warehouse *</label>
              <select value={form.destination_warehouse_id} onChange={(e) => setForm({ ...form, destination_warehouse_id: e.target.value })} className="input" required>
                <option value="">Select...</option>
                {warehouses?.filter(w => String(w.id) !== String(form.source_warehouse_id)).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Expected Date</label>
            <input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} className="input" />
          </div>

          <ItemRows rows={rows} setRows={setRows} items={items} />

          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail / actions modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`Transfer ${detail?.reference_number || `#${detail?.id}`}`} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={detail.status} map={TRANSFER_STATUS} />
              <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--pb-text-3)' }}>
                {detail.source_warehouse?.name} <ArrowRightLeft size={12} /> {detail.destination_warehouse?.name}
              </span>
            </div>
            {detail.notes && <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{detail.notes}</p>}

            <div className="card p-0 overflow-hidden">
              <table className="table w-full text-sm">
                <thead><tr><th>Item</th><th>Qty</th></tr></thead>
                <tbody>
                  {(detail.items || []).map(it => (
                    <tr key={it.id}>
                      <td>{it.inventory_item?.name || it.inventory_item_id}</td>
                      <td>{it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
              {(TRANSFER_STATUS[detail.status]?.actions || []).map(action => (
                <ActionButton key={action} action={action} onClick={() => handleAction(detail.id, action)} pending={actionMutation.isPending} />
              ))}
              {!(TRANSFER_STATUS[detail.status]?.actions || []).length && (
                <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No further actions available for this transfer.</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// ── Purchase Orders tab ──────────────────────────────────────────────────────
function PurchaseOrdersTab({ items, warehouses, suppliers }) {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState(null)
  const [receiveRows, setReceiveRows] = useState(null)
  const [form, setForm] = useState({ supplier_id: '', warehouse_id: '', order_date: '', expected_delivery: '', tax_rate: '', notes: '' })
  const [rows, setRows] = useState([{ inventory_item_id: '', quantity: 1, unit_cost: '', notes: '' }])

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', page],
    queryFn: () => inventoryOperationsApi.listPurchaseOrders({ page }).then(unwrapList),
  })

  const invalidate = () => {
    queryClient.invalidateQueries(['purchase-orders'])
    setDetail(null)
    setReceiveRows(null)
  }

  const createMutation = useMutation({
    mutationFn: (payload) => inventoryOperationsApi.createPurchaseOrder(payload),
    onSuccess: () => {
      toast.success('Draft purchase order created')
      setShowCreate(false)
      setForm({ supplier_id: '', warehouse_id: '', order_date: '', expected_delivery: '', tax_rate: '', notes: '' })
      setRows([{ inventory_item_id: '', quantity: 1, unit_cost: '', notes: '' }])
      queryClient.invalidateQueries(['purchase-orders'])
    },
    onError: (err) => toast.error(err.response?.data?.errors ? Object.values(err.response.data.errors).flat().join(' ') : err.response?.data?.message || 'Failed to create PO'),
  })

  const actionMutation = useMutation({
    mutationFn: ({ id, action, reason, receivePayload }) => {
      if (action === 'submit')   return inventoryOperationsApi.submitPurchaseOrder(id)
      if (action === 'approve')  return inventoryOperationsApi.approvePurchaseOrder(id)
      if (action === 'complete') return inventoryOperationsApi.completePurchaseOrder(id)
      if (action === 'cancel')   return inventoryOperationsApi.cancelPurchaseOrder(id, reason)
      if (action === 'receive')  return inventoryOperationsApi.receivePurchaseOrder(id, receivePayload)
    },
    onSuccess: (_, { action }) => { toast.success(`Purchase order ${action}d`); invalidate() },
    onError: (err) => toast.error(err.response?.data?.errors?.po || err.response?.data?.errors?.receive || err.response?.data?.message || 'Action failed'),
  })

  const handleAction = (po, action) => {
    if (action === 'cancel') {
      const reason = window.prompt('Reason for cancellation (optional):') || undefined
      actionMutation.mutate({ id: po.id, action, reason })
      return
    }
    if (action === 'receive') {
      // Open a quick per-line receive quantity prompt instead of a second modal
      setReceiveRows((po.items || []).map(it => ({
        purchase_order_item_id: it.id,
        label: it.inventory_item?.name || `Item #${it.inventory_item_id}`,
        outstanding: it.quantity - (it.received_quantity || 0),
        quantity: it.quantity - (it.received_quantity || 0),
      })))
      return
    }
    actionMutation.mutate({ id: po.id, action })
  }

  const submitReceive = () => {
    const items = receiveRows
      .filter(r => Number(r.quantity) > 0)
      .map(r => ({ purchase_order_item_id: r.purchase_order_item_id, quantity: Number(r.quantity) }))
    if (!items.length) { toast.error('Enter at least one quantity to receive'); return }
    actionMutation.mutate({ id: detail.id, action: 'receive', receivePayload: { items } })
  }

  const columns = [
    { key: 'po_number', label: 'PO #', render: (r) => <span className="font-medium">{r.po_number || `#${r.id}`}</span> },
    { key: 'supplier', label: 'Supplier', render: (r) => r.supplier?.name || '—' },
    { key: 'warehouse', label: 'Warehouse', render: (r) => r.warehouse?.name || '—' },
    { key: 'total', label: 'Total', render: (r) => formatKES(r.total_amount ?? r.total) },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} map={PO_STATUS} /> },
    { key: 'expected_delivery', label: 'Expected', render: (r) => formatDate(r.expected_delivery) },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> New Purchase Order
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <Table columns={columns} data={data?.data} loading={isLoading} onRowClick={setDetail} emptyMessage="No purchase orders yet." />
        <Pagination meta={data?.meta} onPageChange={setPage} />
      </div>

      {/* Create modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Purchase Order" size="lg">
        <form onSubmit={(e) => {
          e.preventDefault()
          createMutation.mutate({
            ...form,
            tax_rate: form.tax_rate || undefined,
            items: rows.map(r => ({
              inventory_item_id: r.inventory_item_id,
              quantity: Number(r.quantity),
              unit_cost: Number(r.unit_cost),
              notes: r.notes || undefined,
            })),
          })
        }} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Supplier *</label>
              <select value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })} className="input" required>
                <option value="">Select...</option>
                {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Warehouse *</label>
              <select value={form.warehouse_id} onChange={(e) => setForm({ ...form, warehouse_id: e.target.value })} className="input" required>
                <option value="">Select...</option>
                {warehouses?.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Order Date</label>
              <input type="date" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Expected Delivery</label>
              <input type="date" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Tax Rate (%)</label>
              <input type="number" min="0" max="100" step="0.01" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} className="input" />
            </div>
          </div>

          <ItemRows rows={rows} setRows={setRows} items={items} withUnitCost />

          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creating...' : 'Create Draft'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detail / actions modal */}
      <Modal isOpen={!!detail} onClose={() => { setDetail(null); setReceiveRows(null) }} title={`Purchase Order ${detail?.po_number || `#${detail?.id}`}`} size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={detail.status} map={PO_STATUS} />
              <span className="text-sm" style={{ color: 'var(--pb-text-3)' }}>
                {detail.supplier?.name} → {detail.warehouse?.name}
              </span>
            </div>
            {detail.notes && <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{detail.notes}</p>}

            {!receiveRows ? (
              <>
                <div className="card p-0 overflow-hidden">
                  <table className="table w-full text-sm">
                    <thead><tr><th>Item</th><th>Qty</th><th>Received</th><th>Unit Cost</th></tr></thead>
                    <tbody>
                      {(detail.items || []).map(it => (
                        <tr key={it.id}>
                          <td>{it.inventory_item?.name || it.inventory_item_id}</td>
                          <td>{it.quantity}</td>
                          <td>{it.received_quantity || 0}</td>
                          <td>{formatKES(it.unit_cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap gap-2 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
                  {(PO_STATUS[detail.status]?.actions || []).map(action => (
                    <ActionButton key={action} action={action} onClick={() => handleAction(detail, action)} pending={actionMutation.isPending} />
                  ))}
                  {!(PO_STATUS[detail.status]?.actions || []).length && (
                    <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>No further actions available for this PO.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>Enter quantities received</p>
                {receiveRows.map((r, i) => (
                  <div key={r.purchase_order_item_id} className="flex items-center justify-between gap-3">
                    <span className="text-sm flex-1" style={{ color: 'var(--pb-text-2)' }}>
                      {r.label} <span style={{ color: 'var(--pb-text-3)' }}>(outstanding: {r.outstanding})</span>
                    </span>
                    <input
                      type="number" min="0" max={r.outstanding} value={r.quantity}
                      onChange={(e) => setReceiveRows(prev => prev.map((row, idx) => idx === i ? { ...row, quantity: e.target.value } : row))}
                      className="input w-28"
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
                  <button type="button" onClick={() => setReceiveRows(null)} className="btn-secondary">Back</button>
                  <button type="button" onClick={submitReceive} disabled={actionMutation.isPending} className="btn-primary">
                    {actionMutation.isPending ? 'Saving...' : 'Confirm Receipt'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

const ACTION_META = {
  approve:  { label: 'Approve',  icon: Check,         style: { color: '#34d399' } },
  dispatch: { label: 'Dispatch', icon: Truck,          style: { color: '#60a5fa' } },
  receive:  { label: 'Receive',  icon: PackageCheck,   style: { color: '#60a5fa' } },
  cancel:   { label: 'Cancel',   icon: Ban,            style: { color: '#f87171' } },
  reverse:  { label: 'Reverse',  icon: RotateCcw,      style: { color: '#fbbf24' } },
  submit:   { label: 'Submit',   icon: Send,           style: { color: '#60a5fa' } },
  complete: { label: 'Complete', icon: ClipboardCheck, style: { color: '#34d399' } },
}

function ActionButton({ action, onClick, pending }) {
  const meta = ACTION_META[action]
  if (!meta) return null
  const Icon = meta.icon
  return (
    <button onClick={onClick} disabled={pending} className="btn-secondary" style={meta.style}>
      <Icon size={14} /> {meta.label}
    </button>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────
export default function InventoryOperations() {
  const [tab, setTab] = useState('transfers')

  const { data: itemsData } = useQuery({
    queryKey: ['inventory-items-picker'],
    queryFn: () => api.get('/inventory', { params: { per_page: 200 } }).then(unwrapList),
  })
  const { data: warehousesRes } = useQuery({
    queryKey: ['warehouses-picker'],
    queryFn: () => inventoryOperationsApi.listWarehouses().then(r => r.data.data),
  })
  const { data: suppliersRes } = useQuery({
    queryKey: ['suppliers-picker'],
    queryFn: () => inventoryOperationsApi.listSuppliers().then(r => r.data.data),
  })

  const items = itemsData?.data
  const warehouses = Array.isArray(warehousesRes) ? warehousesRes : warehousesRes?.data
  const suppliers = Array.isArray(suppliersRes) ? suppliersRes : suppliersRes?.data

  return (
    <div className="space-y-5">
      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--pb-border)' }}>
        {[
          { key: 'transfers', label: 'Stock Transfers', icon: ArrowRightLeft },
          { key: 'pos',       label: 'Purchase Orders',  icon: ShoppingCart },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={tab === key
              ? { borderColor: '#2563eb', color: '#60a5fa' }
              : { borderColor: 'transparent', color: 'var(--pb-text-3)' }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {!items ? (
        <div className="py-20"><Spinner size="lg" /></div>
      ) : tab === 'transfers' ? (
        <TransfersTab items={items} warehouses={warehouses} />
      ) : (
        <PurchaseOrdersTab items={items} warehouses={warehouses} suppliers={suppliers} />
      )}
    </div>
  )
}