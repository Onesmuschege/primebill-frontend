import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { subscriptionApi } from '../../api/subscription.api';
import {
  CreditCard,
  X,
  Loader2,
  ExternalLink
} from 'lucide-react';

const STATUS_COLORS = {
  trial:     { fg: '#60a5fa', bg: 'rgba(37,99,235,0.12)' },
  active:    { fg: '#34d399', bg: 'rgba(16,185,129,0.12)' },
  past_due:  { fg: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  suspended: { fg: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  cancelled: { fg: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
};

function statusBadge(status) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.cancelled;
  return (
    <span
      className="inline-block px-3 py-1 rounded-full text-sm font-medium capitalize"
      style={{ color: s.fg, backgroundColor: s.bg }}
    >
      {status?.replace('_', ' ')}
    </span>
  );
}

export default function TenantSubscriptionPage() {
  const queryClient = useQueryClient();

  // Fetch current subscription
  // NOTE: unwrap res.data.data — the Laravel ApiResponse trait wraps every
  // payload as { success, message, data, errors }, so the real body lives one
  // level deeper than axios's own response.data (see the same fix applied to
  // SubscriptionPage.jsx, and the convention used app-wide, e.g. AdminRoles.jsx).
  const { data: currentSub, isLoading } = useQuery({
    queryKey: ['subscription-current'],
        queryFn: () => subscriptionApi.getCurrent(),
  });

  // Fetch invoices — this endpoint returns a Laravel paginator inside `data`,
  // so it needs the shared unwrapList helper (same as every other paginated
  // list in the app) rather than a plain `.data` read.
  const { data: invoicesData } = useQuery({
    queryKey: ['subscription-invoices'],
        queryFn: () => subscriptionApi.getInvoices(),
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

  const subscription = currentSub?.subscription;
  const plan = currentSub?.plan;
  const invoices = invoicesData?.data || [];

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel your subscription? Your service will continue until the end of the current billing period.')) {
      cancelMutation.mutate('Cancelled by user');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  // No subscription - show plans page link
  if (!subscription) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card text-center p-8">
          <CreditCard className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--pb-text-3)' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--pb-text-1)' }}>
            No Active Subscription
          </h1>
          <p className="mb-6" style={{ color: 'var(--pb-text-2)' }}>
            You don't have an active subscription yet.
          </p>
          <a href="/subscription/plans" className="btn-primary inline-flex">
            View Plans
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--pb-text-1)' }}>
          My Subscription
        </h1>
        <p style={{ color: 'var(--pb-text-2)' }}>Manage your subscription and billing</p>
      </div>

      {/* Subscription Status Card */}
      <div className="card">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--pb-text-1)' }}>
              {plan?.name}
            </h2>
            {statusBadge(subscription.status)}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
              ${parseFloat(subscription.price).toFixed(2)}
            </p>
            <p style={{ color: 'var(--pb-text-2)' }}>
              /{subscription.billing_cycle === 'annual' ? 'year' : 'month'}
            </p>
          </div>
        </div>

        {/* Subscription Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Started</p>
            <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
              {subscription.starts_at ? new Date(subscription.starts_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Renews On</p>
            <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
              {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          {subscription.trial_ends_at && (
            <div>
              <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Trial Ends</p>
              <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
                {new Date(subscription.trial_ends_at).toLocaleDateString()}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Billing Cycle</p>
            <p className="font-medium capitalize" style={{ color: 'var(--pb-text-1)' }}>
              {subscription.billing_cycle}
            </p>
          </div>
        </div>

        {/* Actions */}
        {subscription.status === 'trial' && (
          <div className="pt-4" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <a href="/subscription/plans" className="btn-primary inline-flex">
              <CreditCard className="w-4 h-4" />
              Upgrade to Paid
            </a>
          </div>
        )}

        {subscription.status === 'active' && (
          <div className="pt-4" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
              style={{ border: '1px solid rgba(239,68,68,0.4)', color: '#f87171' }}
            >
              <X className="w-4 h-4" />
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>
          Recent Invoices
        </h3>
        {invoices.length === 0 ? (
          <p className="text-center py-8" style={{ color: 'var(--pb-text-3)' }}>
            No invoices yet
          </p>
        ) : (
          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{ border: '1px solid var(--pb-border)' }}
              >
                <div>
                  <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>
                    {invoice.invoice_number}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
                    {new Date(invoice.issue_date).toLocaleDateString()} - Due: {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                    ${parseFloat(invoice.total).toFixed(2)}
                  </p>
                  <span
                    className="inline-block px-2 py-1 rounded text-xs font-medium"
                    style={
                      invoice.status === 'paid'
                        ? { color: '#34d399', backgroundColor: 'rgba(16,185,129,0.12)' }
                        : { color: '#fbbf24', backgroundColor: 'rgba(245,158,11,0.12)' }
                    }
                  >
                    {invoice.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}