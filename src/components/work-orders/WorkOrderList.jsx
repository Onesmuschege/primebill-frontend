import { useState, useEffect } from 'react';

export default function WorkOrderList({ clientId }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadWorkOrders();
  }, [clientId, filter]);

  const loadWorkOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (clientId) params.append('client_id', clientId);
      if (filter !== 'all') params.append('status', filter);

      const response = await fetch(`/api/work-orders?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setWorkOrders(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-gray-100 text-gray-800',
      dispatched: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status] || styles.scheduled;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return styles[priority] || styles.normal;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading work orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Work Orders List */}
      {workOrders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <p className="text-gray-500">No work orders found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {workOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-semibold text-gray-700">
                      {order.work_order_number}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{order.type}</h3>
                </div>
              </div>

              <p className="text-gray-700 mb-4">{order.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Client:</span>{' '}
                  {order.client?.first_name} {order.client?.last_name}
                </div>
                {order.scheduled_at && (
                  <div>
                    <span className="font-medium">Scheduled:</span>{' '}
                    {new Date(order.scheduled_at).toLocaleDateString()}
                  </div>
                )}
                {order.assignedTechnician && (
                  <div>
                    <span className="font-medium">Assigned to:</span>{' '}
                    {order.assignedTechnician.name}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}