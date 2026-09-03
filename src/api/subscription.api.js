import api from './axiosInstance';

// Response unwrapping centralized here. The backend's ApiResponse trait
// double-wraps: axios response.data wraps the Laravel trait envelope, which
// itself wraps the real payload under .data. unwrapOne extracts the inner body.
const unwrapOne = (p) => p.then((r) => r.data?.data ?? r.data)

export const subscriptionApi = {
  // Plans
  getPlans: () => unwrapOne(api.get('/subscription/plans')),

  // Current subscription
  getCurrent: () => unwrapOne(api.get('/subscription/current')),

  startTrial: (planId, trialDays = 14) =>
    unwrapOne(api.post('/subscription/start-trial', { plan_id: planId, trial_days: trialDays })),

  convertToPaid: (billingCycle) =>
    unwrapOne(api.post('/subscription/convert', { billing_cycle: billingCycle })),

  cancel: (reason) =>
    unwrapOne(api.post('/subscription/cancel', { reason })),

  // Invoices & Usage
  getInvoices: () => unwrapOne(api.get('/subscription/invoices')),
  getUsage: () => unwrapOne(api.get('/subscription/usage')),
};
