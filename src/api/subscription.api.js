import api from '../utils/api';

export const subscriptionApi = {
  // Plans
  getPlans: () => api.get('/subscription/plans'),

  // Current subscription
  getCurrent: () => api.get('/subscription/current'),
  
  startTrial: (planId, trialDays = 14) => 
    api.post('/subscription/start-trial', { plan_id: planId, trial_days: trialDays }),
  
  convertToPaid: (billingCycle) => 
    api.post('/subscription/convert', { billing_cycle: billingCycle }),
  
  cancel: (reason) => 
    api.post('/subscription/cancel', { reason }),

  // Invoices
  getInvoices: () => api.get('/subscription/invoices'),

  // Usage
  getUsage: () => api.get('/subscription/usage'),
};