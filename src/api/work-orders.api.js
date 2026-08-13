import api from './axiosInstance';

export const getWorkOrders = async (params = {}) => {
  const response = await api.get('/work-orders', { params });
  return response.data;
};

export const getWorkOrder = async (id) => {
  const response = await api.get(`/work-orders/${id}`);
  return response.data;
};

export const createWorkOrder = async (clientId, data) => {
  const response = await api.post(`/clients/${clientId}/work-orders`, data);
  return response.data;
};

export const updateWorkOrder = async (id, data) => {
  const response = await api.put(`/work-orders/${id}`, data);
  return response.data;
};

export const deleteWorkOrder = async (id) => {
  const response = await api.delete(`/work-orders/${id}`);
  return response.data;
};

export const assignTechnician = async (workOrderId, technicianId) => {
  const response = await api.post(`/work-orders/${workOrderId}/assign`, {
    assigned_to: technicianId,
  });
  return response.data;
};

export const updateWorkOrderStatus = async (workOrderId, status, additionalData = {}) => {
  const response = await api.post(`/work-orders/${workOrderId}/status`, {
    status,
    ...additionalData,
  });
  return response.data;
};

export const getWorkOrderStats = async () => {
  const response = await api.get('/work-orders/stats');
  return response.data;
};

export const getTechnicianWorkload = async (technicianId) => {
  const response = await api.get(`/technicians/${technicianId}/workload`);
  return response.data;
};

// ── Materials & Evidence (Release 4 — Field Operations) ─────────────────────
export const getWorkOrderParts = async (workOrderId) => {
  const response = await api.get(`/work-orders/${workOrderId}/parts`);
  return response.data;
};

export const addWorkOrderPart = async (workOrderId, payload) => {
  const response = await api.post(`/work-orders/${workOrderId}/parts`, payload);
  return response.data;
};

export const getWorkOrderAttachments = async (workOrderId) => {
  const response = await api.get(`/work-orders/${workOrderId}/attachments`);
  return response.data;
};

export const addWorkOrderAttachment = async (workOrderId, payload) => {
  const response = await api.post(`/work-orders/${workOrderId}/attachments`, payload);
  return response.data;
};

// ── Completion & Verification (Release 4 — closed-loop field ops) ──────────
export const verifyWorkOrder = async (workOrderId, verificationNotes) => {
  const response = await api.post(`/work-orders/${workOrderId}/verify`, {
    verification_notes: verificationNotes,
  });
  return response.data;
};

export const getWorkOrderStatusHistory = async (workOrderId) => {
  const response = await api.get(`/work-orders/${workOrderId}/status-history`);
  return response.data;
};