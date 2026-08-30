import api, { unwrapList, unwrapOne } from './axiosInstance'

// ---------------------------------------------------------------------------
// Inventory Operations — stock transfers + purchase order workflows
//
// Backed by InventoryOperationsController (routes/api.php, prefix
// `inventory/operations`). This is separate from the basic item CRUD in
// InventoryList.jsx — these are real multi-step workflows
// (draft -> approve -> dispatch -> receive, etc.), not plain REST resources.
//
// All list endpoints resolve to { data, meta } via unwrapList; single-resource
// and mutation endpoints resolve to the unwrapped resource via unwrapOne.
// ---------------------------------------------------------------------------

export const inventoryOperationsApi = {
  // ── Stock movements (single-step, no workflow state) ──
  receiveStock: (data) => api.post('/inventory/operations/stock/receive', data).then(unwrapOne),
  issueStock:   (data) => api.post('/inventory/operations/stock/issue', data).then(unwrapOne),
  adjustStock:  (data) => api.post('/inventory/operations/stock/adjust', data).then(unwrapOne),
  returnStock:  (data) => api.post('/inventory/operations/stock/return', data).then(unwrapOne),
  itemBalances: (itemId) => api.get(`/inventory/operations/items/${itemId}/balances`).then(unwrapOne),

  // ── Stock transfers ──
  listTransfers:  (params = {})  => api.get('/inventory/operations/transfers', { params }).then(unwrapList),
  getTransfer:    (id)           => api.get(`/inventory/operations/transfers/${id}`).then(unwrapOne),
  createTransfer: (data)         => api.post('/inventory/operations/transfers', data).then(unwrapOne),
  approveTransfer:(id)           => api.post(`/inventory/operations/transfers/${id}/approve`).then(unwrapOne),
  dispatchTransfer:(id)          => api.post(`/inventory/operations/transfers/${id}/dispatch`).then(unwrapOne),
  receiveTransfer:(id)           => api.post(`/inventory/operations/transfers/${id}/receive`).then(unwrapOne),
  cancelTransfer: (id, reason)   => api.post(`/inventory/operations/transfers/${id}/cancel`, { reason }).then(unwrapOne),
  reverseTransfer:(id, reason)   => api.post(`/inventory/operations/transfers/${id}/reverse`, { reason }).then(unwrapOne),

  // ── Purchase orders ──
  listPurchaseOrders:   (params = {}) => api.get('/inventory/operations/purchase-orders', { params }).then(unwrapList),
  getPurchaseOrder:     (id)          => api.get(`/inventory/operations/purchase-orders/${id}`).then(unwrapOne),
  createPurchaseOrder:  (data)        => api.post('/inventory/operations/purchase-orders', data).then(unwrapOne),
  submitPurchaseOrder:  (id)          => api.post(`/inventory/operations/purchase-orders/${id}/submit`).then(unwrapOne),
  approvePurchaseOrder: (id)          => api.post(`/inventory/operations/purchase-orders/${id}/approve`).then(unwrapOne),
  receivePurchaseOrder: (id, data)    => api.post(`/inventory/operations/purchase-orders/${id}/receive`, data).then(unwrapOne),
  completePurchaseOrder:(id)          => api.post(`/inventory/operations/purchase-orders/${id}/complete`).then(unwrapOne),
  cancelPurchaseOrder:  (id, reason)  => api.post(`/inventory/operations/purchase-orders/${id}/cancel`, { reason }).then(unwrapOne),

  // ── Reference data (generic catalog-resource endpoints) ──
  listWarehouses: () => api.get('/inventory-ext/warehouses').then(unwrapList),
  listSuppliers:  () => api.get('/inventory-ext/suppliers').then(unwrapList),
}

export default inventoryOperationsApi