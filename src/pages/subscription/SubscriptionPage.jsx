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
  const { data: currentSub } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: subscriptionApi.getCurrent,
  });

  // Fetch plans
  const { data: plansData, isLoading: loadingPlans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: subscriptionApi.getPlans,
  });

  // Fetch usage
  const { data: usageData } = useQuery({
    queryKey: ['subscription-usage'],
    queryFn: subscriptionApi.getUsage,
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

  const plans = plansData?.data || [];
  const subscription = currentSub?.data?.subscription;
  const plan = currentSub?.data?.plan;
  const usage = usageData?.data;

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
    if (slug?.includes('starter')) return 'from-gray-500 to-gray-700';
    if (slug?.includes('professional')) return 'from-blue-500 to-blue-700';
    if (slug?.includes('enterprise')) return 'from-purple-500 to-purple-700';
    return 'from-gray-500 to-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-xl text-gray-600 mb-8">
            Select the perfect plan for your ISP business
          </p>

          {/* Current Subscription Status */}
          {subscription && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-full mb-8">
              <Check className="w-5 h-5" />
              <span className="font-medium">
                Current Plan: {plan?.name} ({subscription.status})
              </span>
            </div>
          )}
        </div>

        {/* Usage Overview */}
        {usage && (
          <div className="bg-white rounded-lg shadow p-6 mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Resource Usage</h2>
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
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {plans.map((planItem) => {
              const isCurrentPlan = subscription?.plan_id === planItem.id;
              const price = billingCycle === 'annual' && planItem.annual_price 
                ? planItem.annual_price 
                : planItem.price;

              return (
                <div
                  key={planItem.id}
                  className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                    isCurrentPlan ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  {isCurrentPlan && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg text-sm font-medium">
                      Current Plan
                    </div>
                  )}

                  <div className={`w-16 h-16 bg-gradient-to-br ${getPlanColor(planItem.slug)} rounded-2xl flex items-center justify-center text-white mb-6`}>
                    {getPlanIcon(planItem.slug)}
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{planItem.name}</h3>
                  <p className="text-gray-600 mb-6">{planItem.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      ${price.toFixed(2)}
                    </span>
                    <span className="text-gray-600">
                      /{billingCycle === 'annual' ? 'year' : 'month'}
                    </span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {planItem.features?.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <div className="flex justify-between">
                      <span>Clients:</span>
                      <span className="font-semibold">{planItem.max_clients}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Users:</span>
                      <span className="font-semibold">{planItem.max_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Routers:</span>
                      <span className="font-semibold">{planItem.max_routers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Storage:</span>
                      <span className="font-semibold">{planItem.storage_quota_gb} GB</span>
                    </div>
                  </div>

                  {isCurrentPlan ? (
                    <button
                      disabled
                      className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : subscription?.status === 'trial' ? (
                    <button
                      onClick={() => {
                        setSelectedPlan(planItem);
                        setShowUpgradeModal(true);
                      }}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      Upgrade to {planItem.name}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedPlan(planItem);
                        setShowUpgradeModal(true);
                      }}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
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
          <div className="flex justify-center items-center gap-4 mb-8">
            <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors"
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${billingCycle === 'annual' ? 'text-gray-900' : 'text-gray-500'}`}>
              Annual <span className="text-green-600">(Save 20%)</span>
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
    </div>
  );
}

function UsageItem({ label, used, limit }) {
  const percentage = limit > 0 ? (used / limit) * 100 : 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-gray-900">
          {used} / {limit}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${
            percentage > 90 ? 'bg-red-600' : percentage > 70 ? 'bg-yellow-600' : 'bg-green-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% used</p>
    </div>
  );
}

function UpgradeModal({ plan, billingCycle, setBillingCycle, onConfirm, onClose, isLoading, currentPlan }) {
  const savings = currentPlan && billingCycle === 'annual' && currentPlan.annual_price
    ? currentPlan.annual_price - plan.annual_price
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Change Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Plan Details */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
          <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

          {/* Billing Cycle Toggle */}
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                billingCycle === 'monthly'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">Monthly</div>
              <div className="text-lg font-bold">${plan.price.toFixed(2)}</div>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`flex-1 py-2 px-4 rounded-lg border-2 ${
                billingCycle === 'annual'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm font-medium">Annual</div>
              <div className="text-lg font-bold">${plan.annual_price?.toFixed(2) || '0.00'}</div>
              {savings > 0 && (
                <div className="text-xs text-green-600 font-medium">Save ${savings.toFixed(2)}</div>
              )}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Features included:</h4>
          <ul className="space-y-1">
            {plan.features?.slice(0, 5).map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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