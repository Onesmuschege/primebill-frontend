import { useState, useEffect } from 'react';
import WorkOrderList from '../../components/work-orders/WorkOrderList';
import { getWorkOrderStats } from '../../api/work-orders.api';

export default function WorkOrdersPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const response = await getWorkOrderStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load work order stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Field Operations</h1>
        <p className="mt-1" style={{ color: 'var(--pb-text-2)' }}>Manage work orders, installations, and field service</p>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-8 rounded mb-2" style={{ backgroundColor: 'var(--pb-raised)' }}></div>
              <div className="h-4 rounded w-20" style={{ backgroundColor: 'var(--pb-raised)' }}></div>
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="text-3xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{stats.total || 0}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-2)' }}>Total Work Orders</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-blue-600">{stats.scheduled || 0}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-2)' }}>Scheduled</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-yellow-600">{stats.in_progress || 0}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-2)' }}>In Progress</div>
          </div>
          <div className="card">
            <div className="text-3xl font-bold text-green-600">{stats.completed_today || 0}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-2)' }}>Completed Today</div>
          </div>
        </div>
      ) : null}

      {/* Work Orders by Type */}
      {stats && stats.by_type && stats.by_type.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Work Orders by Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats.by_type.map((type) => (
              <div key={type.type} className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{type.count}</div>
                <div className="text-sm capitalize" style={{ color: 'var(--pb-text-2)' }}>{type.type}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Orders by Priority */}
      {stats && stats.by_priority && stats.by_priority.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Work Orders by Priority</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.by_priority.map((priority) => (
              <div key={priority.priority} className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--pb-text-1)' }}>{priority.count}</div>
                <div className="text-sm capitalize" style={{ color: 'var(--pb-text-2)' }}>{priority.priority}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Work Orders List */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--pb-text-1)' }}>Work Orders</h2>
        <WorkOrderList />
      </div>
    </div>
  );
}