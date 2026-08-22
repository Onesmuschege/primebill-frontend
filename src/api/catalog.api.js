import api, { unwrapList } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// ---------------------------------------------------------------------------
// Catalog domains wired in Phase D (routes/api.php). Every resource key here
// is a real, working catalog entry — the models/migrations/routes already
// exist on the backend for all of them via HandlesCatalogResources; this file
// (and CatalogPage.jsx) is what makes them reachable from the UI. Each group
// lists every resource under its route prefix, matching each controller's
// $catalogResources map exactly (verified against the controller source, not
// guessed) — a group is not "done" until every one of its resources is here.
// ---------------------------------------------------------------------------
export const CATALOG_GROUPS = [
  {
    prefix: 'service-catalog', label: 'Service Catalog',
    resources: ['service-templates', 'provisioning-profiles', 'service-addons', 'client-account-addons', 'service-relocations', 'service-changes', 'account-histories'],
  },
  {
    prefix: 'equipment', label: 'Customer Equipment',
    resources: ['customer-equipment', 'equipment-assignments', 'equipment-histories'],
  },
  {
    prefix: 'router-config', label: 'Router Config',
    resources: ['router-interfaces', 'router-templates', 'router-configurations', 'router-backups', 'router-command-logs'],
  },
  {
    prefix: 'radius-advanced', label: 'Advanced RADIUS',
    resources: ['radius-profiles', 'radius-attributes', 'radius-coa-requests', 'radius-disconnect-requests'],
  },
  {
    prefix: 'fiber-ext', label: 'Fiber Extensions',
    resources: ['ont-signal-histories', 'ont-events', 'fiber-connections'],
  },
  {
    prefix: 'inventory-ext', label: 'Inventory Ext',
    resources: ['warehouses', 'suppliers', 'stock-movements', 'stock-transfers', 'stock-transfer-items', 'purchase-orders', 'purchase-order-items', 'warranties', 'inventory-assignments', 'inventory-item-histories'],
  },
  {
    prefix: 'support-catalog', label: 'Support Catalog',
    resources: ['departments', 'ticket-queues', 'ticket-categories', 'sla-policies', 'sla-rules', 'ticket-escalations', 'kb-categories', 'kb-articles', 'announcements', 'maintenance-notices'],
  },
  {
    prefix: 'communications', label: 'Communications',
    resources: ['communication-templates', 'communication-logs', 'notification-preferences', 'campaigns', 'campaign-recipients', 'webhooks', 'webhook-deliveries'],
  },
  {
    prefix: 'customer-experience', label: 'Customer Experience',
    resources: ['customer-interactions', 'customer-journey-events', 'customer-feedback', 'customer-satisfactions'],
  },
  {
    prefix: 'security-admin', label: 'Security',
    resources: ['security-events', 'user-devices'],
  },
  {
    prefix: 'field-ops', label: 'Field Operations',
    resources: ['work-order-templates', 'work-order-checklists', 'work-order-parts', 'work-order-attachments', 'work-order-status-histories', 'technician-locations', 'technician-availabilities'],
  },
  {
    prefix: 'reporting', label: 'Reporting',
    resources: ['saved-reports', 'report-schedules', 'report-deliveries', 'dashboards', 'dashboard-widgets'],
  },
]

// Human-readable label for a resource segment, e.g. 'kb-articles' -> 'Kb Articles'.
export const resourceLabel = (resource = '') =>
  resource.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')

export const catalogGroupLabels = (prefix) =>
  (CATALOG_GROUPS.find((g) => g.prefix === prefix) || {}).label || prefix

// ---------------------------------------------------------------------------
// Generic REST over /{prefix}/{resource}[/{id}]
// ---------------------------------------------------------------------------

export const listCatalog = async (group, resource, params = {}) => {
  const response = await api.get(`/${group}/${resource}`, { params: clean(params) })
  return unwrapList(response)
}

export const getCatalogItem = (group, resource, id) =>
  api.get(`/${group}/${resource}/${id}`)

export const createCatalogItem = (group, resource, data) =>
  api.post(`/${group}/${resource}`, data)

export const updateCatalogItem = (group, resource, id, data) =>
  api.put(`/${group}/${resource}/${id}`, data)

export const deleteCatalogItem = (group, resource, id) =>
  api.delete(`/${group}/${resource}/${id}`)

// Campaigns expose an explicit lifecycle transition.
export const transitionCampaign = (id, data) =>
  api.post(`/communications/campaigns/${id}/transition`, data)

// ---------------------------------------------------------------------------
// Typed convenience accessors for the most common catalog resources
// ---------------------------------------------------------------------------
export const listServiceTemplates = (params = {}) => listCatalog('service-catalog', 'service-templates', params)
export const listWarehouses = (params = {}) => listCatalog('inventory-ext', 'warehouses', params)
export const listDepartments = (params = {}) => listCatalog('support-catalog', 'departments', params)
export const listCampaigns = (params = {}) => listCatalog('communications', 'campaigns', params)
export const listSavedReports = (params = {}) => listCatalog('reporting', 'saved-reports', params)
export const listDashboards = (params = {}) => listCatalog('reporting', 'dashboards', params)
export const listTechnicianLocations = (params = {}) => listCatalog('field-ops', 'technician-locations', params)
export const listTechnicianAvailabilities = (params = {}) => listCatalog('field-ops', 'technician-availabilities', params)

