import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { subscriptionApi } from '../../api/subscription.api';
import {
  CreditCard,
  Check,
  X,
  Crown,
  Zap,
  Building,
  Loader2
} from 'lucide-react';

export default function SubscriptionPage() {
  const queryClient = useQueryClient();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  // Fetch current subscription
  // NOTE: unwrap res.data.data — the Laravel ApiResponse trait wraps every
  // payload as { success, message, data, errors }, so the real body lives one
  // level deeper than axios's own response.data. This matches the convention
  // used everywhere else in the app (see AdminRoles.jsx, ProspectDetail.jsx,
  // PlatformSubscriptions.jsx, etc.) — this page previously skipped the
  // unwrap and read the envelope object itself, which broke plans.map().
  const { data: currentSub } = useQuery({
    queryKey: ['subscription-current'],
        queryFn: () => subscriptionApi.getCurrent(),
  });

  // Fetch plans
  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
        queryFn: () => subscriptionApi.getPlans(),
  });

  // Fetch usage
  const { data: usageData } = useQuery({
    queryKey: ['subscription-usage'],
        queryFn: () => subscriptionApi.getUsage(),
  });

  // Convert to paid mutation
  const convertMutation = useMutation({
    mutationFn: subscriptionApi.convertToPaid,
    onSuccess: () => {
      queryClient.invalidateQueries(['subscription-current']);
      toast.success('Subscription activated!');
      setShowUpgradeModal(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to activate subscription');
    },
  });

  const plans = Array.isArray(plansData) ? plansData : [];
  const subscription = currentSub?.subscription;
  const plan = currentSub?.plan;
  const usage = usageData;

  const handleUpgrade = () => {
    if (!selectedPlan) return;
    convertMutation.mutate(billingCycle);
  };

  const getPlanIcon = (slug) => {
    if (slug?.includes('starter')) return <Zap className="w-8 h-8" />;
    if (slug?.includes('professional')) return <Crown className="w-8 h-8" />;
    if (slug?.includes('enterprise')) return <Building className="w-8 h-8" />;
    return <CreditCard className="w-8 h-8" />;
  };

  const getPlanColor = (slug) => {
    if (slug?.includes('starter')) return 'from-slate-500 to-slate-700';
    if (slug?.includes('professional')) return 'from-blue-500 to-blue-700';
    if (slug?.includes('enterprise')) return 'from-purple-500 to-purple-700';
    return 'from-slate-500 to-slate-700';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--pb-text-1)' }}>
          Choose Your Plan
        </h1>
        <p className="text-lg mb-6" style={{ color: 'var(--pb-text-2)' }}>
          Select the perfect plan for your ISP business
        </p>

        {/* Current Subscription Status */}
        {subscription && (
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#34d399' }}
          >
            <Check className="w-5 h-5" />
            <span className="font-medium">
              Current Plan: {plan?.name} ({subscription.status})
            </span>
          </div>
        )}
      </div>

      {/* Usage Overview */}
      {usage && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>
            Resource Usage
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UsageItem
              label="Clients"
              used={usage.usage?.clients || 0}
              limit={usage.limits?.max_clients || 0}
            />
            <UsageItem
              label="Users"
              used={usage.usage?.users || 0}
              limit={usage.limits?.max_users || 0}
            />
            <UsageItem
              label="Routers"
              used={usage.usage?.routers || 0}
              limit={usage.limits?.max_routers || 0}
            />
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {loadingPlans ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((planItem) => {
            const isCurrentPlan = subscription?.plan_id === planItem.id;
            const price = Number(
              billingCycle === 'annual' && planItem.annual_price
                ? planItem.annual_price
                : planItem.price
            );

            return (
              <div
                key={planItem.id}
                className="card relative rounded-2xl p-8"
                style={isCurrentPlan ? { boxShadow: '0 0 0 2px #2563eb' } : undefined}
              >
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-primary-600 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                    Current Plan
                  </div>
                )}

                <div className={`w-16 h-16 bg-gradient-to-br ${getPlanColor(planItem.slug)} rounded-2xl flex items-center justify-center text-white mb-6`}>
                  {getPlanIcon(planItem.slug)}
                </div>

                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--pb-text-1)' }}>
                  {planItem.name}
                </h3>
                <p className="mb-6" style={{ color: 'var(--pb-text-2)' }}>
                  {planItem.description}
                </p>

                <div className="mb-6">
                  <span className="text-4xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
                    ${price.toFixed(2)}
                  </span>
                  <span style={{ color: 'var(--pb-text-2)' }}>
                    /{billingCycle === 'annual' ? 'year' : 'month'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {planItem.features?.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm" style={{ color: 'var(--pb-text-2)' }}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-2 text-sm mb-6" style={{ color: 'var(--pb-text-2)' }}>
                  <div className="flex justify-between">
                    <span>Clients:</span>
                    <span className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                      {planItem.max_clients}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Users:</span>
                    <span className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                      {planItem.max_users}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Routers:</span>
                    <span className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                      {planItem.max_routers}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage:</span>
                    <span className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
                      {planItem.storage_quota_gb} GB
                    </span>
                  </div>
                </div>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg font-medium cursor-not-allowed"
                    style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-3)' }}
                  >
                    Current Plan
                  </button>
                ) : subscription?.status === 'trial' ? (
                  <button
                    onClick={() => {
                      setSelectedPlan(planItem);
                      setShowUpgradeModal(true);
                    }}
                    className="btn-primary w-full"
                  >
                    Upgrade to {planItem.name}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedPlan(planItem);
                      setShowUpgradeModal(true);
                    }}
                    className="btn-primary w-full"
                  >
                    Change Plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Billing Toggle */}
      {!subscription && (
        <div className="flex justify-center items-center gap-4">
          <span
            className="text-sm font-medium"
            style={{ color: billingCycle === 'monthly' ? 'var(--pb-text-1)' : 'var(--pb-text-3)' }}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600 transition-colors"
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span
            className="text-sm font-medium"
            style={{ color: billingCycle === 'annual' ? 'var(--pb-text-1)' : 'var(--pb-text-3)' }}
          >
            Annual <span className="text-emerald-500">(Save 20%)</span>
          </span>
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedPlan && (
        <UpgradeModal
          plan={selectedPlan}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
          onConfirm={handleUpgrade}
          onClose={() => {
            setShowUpgradeModal(false);
            setSelectedPlan(null);
          }}
          isLoading={convertMutation.isPending}
          currentPlan={plan}
        />
      )}
    </div>
  );
}

function UsageItem({ label, used, limit }) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const barColor = percentage > 90 ? '#ef4444' : percentage > 70 ? '#f59e0b' : '#10b981';

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span style={{ color: 'var(--pb-text-2)' }}>{label}</span>
        <span className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>
          {used} / {limit}
        </span>
      </div>
      <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--pb-border)' }}>
        <div
          className="h-2 rounded-full"
          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: barColor }}
        />
      </div>
      <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>
        {percentage.toFixed(1)}% used
      </p>
    </div>
  );
}

function UpgradeModal({ plan, billingCycle, setBillingCycle, onConfirm, onClose, isLoading, currentPlan }) {
  const savings = currentPlan && billingCycle === 'annual' && currentPlan.annual_price
    ? Number(currentPlan.annual_price) - Number(plan.annual_price)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-lg max-w-md w-full p-6"
        style={{ backgroundColor: 'var(--pb-surface)', boxShadow: 'var(--shadow-modal)', border: '1px solid var(--pb-border)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
            Change Plan
          </h2>
          <button onClick={onClose} className="btn-ghost p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plan Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--pb-text-1)' }}>
            {plan.name}
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--pb-text-2)' }}>
            {plan.description}
          </p>

          {/* Billing Cycle Toggle */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className="flex-1 py-2 px-4 rounded-lg border-2 transition-colors"
              style={
                billingCycle === 'monthly'
                  ? { borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)' }
                  : { borderColor: 'var(--pb-border)' }
              }
            >
              <div className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>Monthly</div>
              <div className="text-lg font-bold" style={{ color: 'var(--pb-text-1)' }}>
                ${Number(plan.price).toFixed(2)}
              </div>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className="flex-1 py-2 px-4 rounded-lg border-2 transition-colors"
              style={
                billingCycle === 'annual'
                  ? { borderColor: '#2563eb', backgroundColor: 'rgba(37,99,235,0.08)' }
                  : { borderColor: 'var(--pb-border)' }
              }
            >
              <div className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>Annual</div>
              <div className="text-lg font-bold" style={{ color: 'var(--pb-text-1)' }}>
                ${plan.annual_price ? Number(plan.annual_price).toFixed(2) : '0.00'}
              </div>
              {savings > 0 && (
                <div className="text-xs text-emerald-500 font-medium">Save ${savings.toFixed(2)}</div>
              )}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--pb-text-1)' }}>
            Features included:
          </h4>
          <ul className="space-y-1">
            {plan.features?.slice(0, 5).map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm" style={{ color: 'var(--pb-text-2)' }}>
                <Check className="w-4 h-4 text-emerald-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="btn-primary flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                Subscribe
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}