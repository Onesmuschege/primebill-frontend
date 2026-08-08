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