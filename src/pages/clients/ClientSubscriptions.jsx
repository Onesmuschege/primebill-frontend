import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { customerSubscriptionApi } from '../../api/customer-subscription.api';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle,
  XCircle,
  Clock,
  X
} from 'lucide-react';

export default function ClientSubscriptions({ clientId }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Fetch subscriptions
  const { data: subscriptionsData, isLoading } = useQuery({
    queryKey: ['client-subscriptions', clientId, search, statusFilter],
    queryFn: async () => {
      const filters = {};
      if (search) filters.search = search;
      if (statusFilter !== 'all') filters.status = statusFilter;
      const response = await customerSubscriptionApi.list(clientId, filters);
      return response.data.data;
    },
  });

  // Fetch active subscriptions count
  const { data: activeData } = useQuery({
    queryKey: ['client-active-subscriptions', clientId],
    queryFn: () => customerSubscriptionApi.active(clientId),
  });

  // Fetch expiring soon
  const { data: expiringData } = useQuery({
    queryKey: ['client-expiring-subscriptions', clientId],
    queryFn: () => customerSubscriptionApi.expiringSoon(clientId),
  });

  const subscriptions = subscriptionsData?.data || [];
  const activeCount = activeData?.data?.length || 0;
  const expiringCount = expiringData?.data?.length || 0;

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
      suspended: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Suspended' },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
      expired: { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Expired' },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Completed' },
    };
    const badge = badges[status] || badges.active;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const colors = {
      new: 'bg-blue-100 text-blue-800',
      upgrade: 'bg-green-100 text-green-800',
      downgrade: 'bg-yellow-100 text-yellow-800',
      renewal: 'bg-purple-100 text-purple-800',
      addon: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {type?.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer Subscriptions</h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeCount} active {expiringCount > 0 && `• ${expiringCount} expiring soon`}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4" />
          New Subscription
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search subscriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Starts</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ends</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    Loading subscriptions...
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sub.name}</div>
                      <div className="text-xs text-gray-500">{sub.product?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(sub.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(sub.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(sub.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.ends_at ? new Date(sub.ends_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sub.remaining_days !== null ? (
                        <span className={sub.remaining_days < 7 ? 'text-red-600 font-medium' : ''}>
                          {sub.remaining_days} days
                        </span>
                      ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowDetailModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Detail Modal */}
      {showDetailModal && selectedSubscription && (
        <SubscriptionDetailModal
          subscription={selectedSubscription}
          clientId={clientId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSubscription(null);
          }}
          onUpdate={() => {
            queryClient.invalidateQueries(['client-subscriptions', clientId]);
            queryClient.invalidateQueries(['client-active-subscriptions', clientId]);
            queryClient.invalidateQueries(['client-expiring-subscriptions', clientId]);
          }}
        />
      )}
    </div>
  );
}

function SubscriptionDetailModal({ subscription, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Subscription Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex gap-6">
              {['overview', 'invoices', 'history'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Subscription Name</h3>
                  <p className="mt-1 text-sm text-gray-900">{subscription.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Status</h3>
                  <p className="mt-1">{getStatusBadge(subscription.status)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Type</h3>
                  <p className="mt-1">{getTypeBadge(subscription.type)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Plan</h3>
                  <p className="mt-1 text-sm text-gray-900">{subscription.plan?.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Price</h3>
                  <p className="mt-1 text-2xl font-bold text-gray-900">${parseFloat(subscription.price).toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total</h3>
                  <p className="mt-1 text-lg font-semibold text-gray-900">${parseFloat(subscription.total).toFixed(2)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Started</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {subscription.starts_at ? new Date(subscription.starts_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Ends</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {subscription.ends_at ? new Date(subscription.ends_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invoices</h3>
              <p className="text-gray-500">Invoice history loading...</p>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">History</h3>
              <p className="text-gray-500">Audit log loading...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusBadge(status) {
  const badges = {
    pending: 'bg-yellow-100 text-yellow-800',
    active: 'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
    expired: 'bg-gray-100 text-gray-800',
    completed: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
      {status?.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function getTypeBadge(type) {
  const colors = {
    new: 'bg-blue-100 text-blue-800',
    upgrade: 'bg-green-100 text-green-800',
    downgrade: 'bg-yellow-100 text-yellow-800',
    renewal: 'bg-purple-100 text-purple-800',
    addon: 'bg-gray-100 text-gray-800',
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
      {type?.toUpperCase()}
    </span>
  );
}