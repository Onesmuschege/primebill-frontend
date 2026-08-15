import { useState, useEffect } from 'react';
import { getWorkOrders } from '../../api/work-orders.api';

export default function WorkOrderList({ clientId }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadWorkOrders();
  }, [clientId, filter]);

  const loadWorkOrders = async () => {
    try {
      const params = {};
      if (clientId) params.client_id = clientId;
      if (filter !== 'all') params.status = filter;

      const data = await getWorkOrders(params);

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
        <div style={{ color: 'var(--pb-text-3)' }}>Loading work orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {['all', 'scheduled', 'in_progress', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : ''
            }`}
            style={filter === status ? {} : {
              backgroundColor: 'var(--pb-raised)',
              color: 'var(--pb-text-2)',
              border: '1px solid var(--pb-border)',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Work Orders List */}
      {workOrders.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--pb-text-3)' }}>
          <div className="text-6xl mb-4">📋</div>
          <p style={{ color: 'var(--pb-text-2)' }}>No work orders found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {workOrders.map((order) => (
            <div
              key={order.id}
              className="card card-hover"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-sm font-semibold" style={{ color: 'var(--pb-text-2)' }}>
                      {order.work_order_number}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityBadge(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold capitalize" style={{ color: 'var(--pb-text-1)' }}>{order.type}</h3>
                </div>
              </div>

              <p className="mb-4" style={{ color: 'var(--pb-text-2)' }}>{order.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: 'var(--pb-text-2)' }}>
                <div>
                  <span className="font-medium" style={{ color: 'var(--pb-text-3)' }}>Client:</span>{' '}
                  {order.client?.first_name} {order.client?.last_name}
                </div>
                {order.scheduled_at && (
                  <div>
                    <span className="font-medium" style={{ color: 'var(--pb-text-3)' }}>Scheduled:</span>{' '}
                    {new Date(order.scheduled_at).toLocaleDateString()}
                  </div>
                )}
                {order.assignedTechnician && (
                  <div>
                    <span className="font-medium" style={{ color: 'var(--pb-text-3)' }}>Assigned to:</span>{' '}
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