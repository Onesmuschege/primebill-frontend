import api, { unwrapList } from './axiosInstance'

const clean = (params = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
  )

// ---------------------------------------------------------------------------
// Catalog domains wired in Phase D (routes/api.php). Each entry names the API
// group prefix and a sensible default `resource` segment for the UI browser.
// ---------------------------------------------------------------------------
export const CATALOG_GROUPS = [
  { prefix: 'service-catalog', label: 'Service Catalog', resource: 'service-templates' },
  { prefix: 'equipment', label: 'Customer Equipment', resource: 'customer-equipment' },
  { prefix: 'router-config', label: 'Router Config', resource: 'router-templates' },
  { prefix: 'radius-advanced', label: 'Advanced RADIUS', resource: 'radius-profiles' },
  { prefix: 'fiber-ext', label: 'Fiber Extensions', resource: 'ont-events' },
  { prefix: 'inventory-ext', label: 'Inventory Ext', resource: 'warehouses' },
  { prefix: 'support-catalog', label: 'Support Catalog', resource: 'departments' },
  { prefix: 'communications', label: 'Communications', resource: 'communication-templates' },
  { prefix: 'customer-experience', label: 'Customer Experience', resource: 'customer-interactions' },
  { prefix: 'security-admin', label: 'Security', resource: 'security-events' },
  { prefix: 'field-ops', label: 'Field Operations', resource: 'work-order-templates' },
  { prefix: 'reporting', label: 'Reporting', resource: 'saved-reports' },
]

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