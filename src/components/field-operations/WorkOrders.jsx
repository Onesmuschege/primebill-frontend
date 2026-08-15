import { useState, useEffect } from 'react';
import { getWorkOrders, getWorkOrderStats } from '../../api/work-orders.api';

export default function WorkOrders({ clientId }) {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      const params = clientId ? { client_id: clientId } : {};
      const [ordersResponse, statsResponse] = await Promise.all([
        getWorkOrders(params),
        getWorkOrderStats(),
      ]);
      setWorkOrders(ordersResponse.data || []);
      setStats(statsResponse.data || null);
    } catch (error) {
      console.error('Failed to load work orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-gray-100 text-gray-800',
      dispatched: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      normal: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="flex justify-center py-4" style={{ color: 'var(--pb-text-3)' }}>Loading work orders...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--pb-text-1)' }}>Work Orders</h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-secondary"
        >
          Create Work Order
        </button>
      </div>

      {showForm && (
        <div className="card">
          <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Work order form would go here</p>
          <button
            onClick={() => setShowForm(false)}
            className="btn-secondary mt-2"
          >
            Cancel
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="card">
            <div className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{stats.total || 0}</div>
            <div className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Total</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{stats.scheduled || 0}</div>
            <div className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Scheduled</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{stats.in_progress || 0}</div>
            <div className="text-sm" style={{ color: 'var(--pb-text-2)' }}>In Progress</div>
          </div>
          <div className="card">
            <div className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{stats.completed_today || 0}</div>
            <div className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Completed Today</div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {workOrders.length === 0 ? (
          <p className="text-center py-4" style={{ color: 'var(--pb-text-2)' }}>No work orders found</p>
        ) : (
          workOrders.map((order) => (
            <div key={order.id} className="card card-hover">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-mono text-sm" style={{ color: 'var(--pb-text-2)' }}>{order.work_order_number}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </div>
                  <p className="font-medium" style={{ color: 'var(--pb-text-1)' }}>{order.description}</p>
                  <div className="mt-2 text-sm" style={{ color: 'var(--pb-text-3)' }}>
                    <span className="capitalize">{order.type}</span>
                    {order.scheduled_at && (
                      <span> • Scheduled: {new Date(order.scheduled_at).toLocaleDateString()}</span>
                    )}
                    {order.assignedTechnician && (
                      <span> • Assigned to: {order.assignedTechnician.name}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}