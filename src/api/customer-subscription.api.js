import api from './axiosInstance';

export const customerSubscriptionApi = {
  // List subscriptions for a client
  list: (clientId, filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.type) params.append('type', filters.type);
    return api.get(`/clients/${clientId}/subscriptions?${params}`);
  },

  // Get single subscription
  show: (clientId, subscriptionId) =>
    api.get(`/clients/${clientId}/subscriptions/${subscriptionId}`),

  // Create subscription
  create: (clientId, data) =>
    api.post(`/clients/${clientId}/subscriptions`, data),

  // Activate subscription
  activate: (clientId, subscriptionId) =>
    api.post(`/clients/${clientId}/subscriptions/${subscriptionId}/activate`),

  // Suspend subscription
  suspend: (clientId, subscriptionId, reason) =>
    api.post(`/clients/${clientId}/subscriptions/${subscriptionId}/suspend`, { reason }),

  // Resume subscription
  resume: (clientId, subscriptionId) =>
    api.post(`/clients/${clientId}/subscriptions/${subscriptionId}/resume`),

  // Cancel subscription
  cancel: (clientId, subscriptionId, reason) =>
    api.post(`/clients/${clientId}/subscriptions/${subscriptionId}/cancel`, { reason }),

  // Upgrade/downgrade subscription
  upgrade: (clientId, subscriptionId, data) =>
    api.post(`/clients/${clientId}/subscriptions/${subscriptionId}/upgrade`, data),

  // Renew subscription
  renew: (clientId, subscriptionId) =>
    api.post(`/clients/${clientId}/subscriptions/${subscriptionId}/renew`),

  // Get active subscriptions
  active: (clientId) =>
    api.get(`/clients/${clientId}/subscriptions/active`),

  // Get expiring soon subscriptions
  expiringSoon: (clientId) =>
    api.get(`/clients/${clientId}/subscriptions/expiring-soon`),
};