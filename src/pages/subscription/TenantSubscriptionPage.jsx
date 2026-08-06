import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { subscriptionApi } from '../../api/subscription.api';
import { 
  CreditCard, 
  X, 
  Loader2,
  ExternalLink
} from 'lucide-react';

export default function TenantSubscriptionPage() {
  const queryClient = useQueryClient();

  // Fetch current subscription
  const { data: currentSub, isLoading } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: subscriptionApi.getCurrent,
  });

  // Fetch invoices
  const { data: invoicesData } = useQuery({
    queryKey: ['subscription-invoices'],
    queryFn: subscriptionApi.getInvoices,
  });

  // Cancel subscription mutation
  const cancelMutation = useMutation({
    mutationFn: (reason) => subscriptionApi.cancel(reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription-current']);
      toast.success('Subscription cancelled successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    },
  });

  const subscription = currentSub?.data?.subscription;
  const plan = currentSub?.data?.plan;
  const invoices = invoicesData?.data || [];

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your subscription? Your service will continue until the end of the current billing period.')) {
      cancelMutation.mutate('Cancelled by user');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // No subscription - show plans page link
  if (!subscription) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No Active Subscription</h1>
            <p className="text-gray-600 mb-6">You don't have an active subscription yet.</p>
            <a
              href="/subscription/plans"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Plans
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subscription</h1>
          <p className="text-gray-600">Manage your subscription and billing</p>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">{plan?.name}</h2>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
                {subscription.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900">${parseFloat(subscription.price).toFixed(2)}</p>
              <p className="text-gray-600">/{subscription.billing_cycle === 'annual' ? 'year' : 'month'}</p>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Started</p>
              <p className="font-medium">{subscription.starts_at ? new Date(subscription.starts_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Renews On</p>
              <p className="font-medium">{subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : 'N/A'}</p>
            </div>
            {subscription.trial_ends_at && (
              <div>
                <p className="text-sm text-gray-600">Trial Ends</p>
                <p className="font-medium">{new Date(subscription.trial_ends_at).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-600">Billing Cycle</p>
              <p className="font-medium capitalize">{subscription.billing_cycle}</p>
            </div>
          </div>

          {/* Actions */}
          {subscription.status === 'trial' && (
            <div className="border-t border-gray-200 pt-4">
              <a
                href="/subscription/plans"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CreditCard className="w-4 h-4" />
                Upgrade to Paid
              </a>
            </div>
          )}

          {subscription.status === 'active' && (
            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Cancel Subscription
              </button>
            </div>
          )}
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Invoices</h3>
          {invoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {invoices.slice(0, 5).map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoice_number}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(invoice.issue_date).toLocaleDateString()} - Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${parseFloat(invoice.total).toFixed(2)}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}