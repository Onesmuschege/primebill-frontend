import api from './axiosInstance'

// ---------------------------------------------------------------------------
// Inventory Operations — stock transfers + purchase order workflows
//
// Backed by InventoryOperationsController (routes/api.php, prefix
// `inventory/operations`). This is separate from the basic item CRUD in
// inventory.api.js / InventoryList.jsx — these are real multi-step workflows
// (draft -> approve -> dispatch -> receive, etc.), not plain REST resources.
// ---------------------------------------------------------------------------

export const inventoryOperationsApi = {
  // ── Stock movements (single-step, no workflow state) ──
  receiveStock: (data) => api.post('/inventory/operations/stock/receive', data),
  issueStock:   (data) => api.post('/inventory/operations/stock/issue', data),
  adjustStock:  (data) => api.post('/inventory/operations/stock/adjust', data),
  returnStock:  (data) => api.post('/inventory/operations/stock/return', data),
  itemBalances: (itemId) => api.get(`/inventory/operations/items/${itemId}/balances`),

  // ── Stock transfers ──
  listTransfers:  (params = {})  => api.get('/inventory/operations/transfers', { params }),
  getTransfer:    (id)           => api.get(`/inventory/operations/transfers/${id}`),
  createTransfer: (data)         => api.post('/inventory/operations/transfers', data),
  approveTransfer:(id)           => api.post(`/inventory/operations/transfers/${id}/approve`),
  dispatchTransfer:(id)          => api.post(`/inventory/operations/transfers/${id}/dispatch`),
  receiveTransfer:(id)           => api.post(`/inventory/operations/transfers/${id}/receive`),
  cancelTransfer: (id, reason)   => api.post(`/inventory/operations/transfers/${id}/cancel`, { reason }),
  reverseTransfer:(id, reason)   => api.post(`/inventory/operations/transfers/${id}/reverse`, { reason }),

  // ── Purchase orders ──
  listPurchaseOrders:   (params = {}) => api.get('/inventory/operations/purchase-orders', { params }),
  getPurchaseOrder:     (id)          => api.get(`/inventory/operations/purchase-orders/${id}`),
  createPurchaseOrder:  (data)        => api.post('/inventory/operations/purchase-orders', data),
  submitPurchaseOrder:  (id)          => api.post(`/inventory/operations/purchase-orders/${id}/submit`),
  approvePurchaseOrder: (id)          => api.post(`/inventory/operations/purchase-orders/${id}/approve`),
  receivePurchaseOrder: (id, data)    => api.post(`/inventory/operations/purchase-orders/${id}/receive`, data),
  completePurchaseOrder:(id)          => api.post(`/inventory/operations/purchase-orders/${id}/complete`),
  cancelPurchaseOrder:  (id, reason)  => api.post(`/inventory/operations/purchase-orders/${id}/cancel`, { reason }),

  // ── Reference data (generic catalog-resource endpoints) ──
  listWarehouses: () => api.get('/inventory-ext/warehouses'),
  listSuppliers:  () => api.get('/inventory-ext/suppliers'),
}

export default inventoryOperationsApi