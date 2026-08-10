import api from './axiosInstance';

export const getTechnicians = async () => {
  const response = await api.get('/technicians');
  return response.data;
};

export const getTechnicianWorkload = async (technicianId) => {
  const response = await api.get(`/technicians/${technicianId}/workload`);
  return response.data;
};
