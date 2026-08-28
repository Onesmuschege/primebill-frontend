import { useState, useMemo } from 'react';
import {
  Users, RefreshCw, CheckCircle2, Clock3, Wifi, Activity,
  Search,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { getInitials } from '../../utils/formatDate';
import { getTechnicians } from '../../api/technicians.api';

// Stable fallback so the useMemo below doesn't see a fresh array each render
// while the technicians query is initially undefined.
const EMPTY_TECHNICIANS = [];

export default function TechniciansPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Server state via the standard TanStack Query pattern. The backend
  // `listTechnicians` endpoint returns the full technician set + statistics,
  // and does NOT accept search/status/page params — so filtering and
  // pagination intentionally stay client-side (we don't invent server filters).
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => getTechnicians().then((res) => res.data),
  });

  const technicians = data?.technicians ?? EMPTY_TECHNICIANS;
  const statistics = data?.statistics || {
    total: 0, available: 0, busy: 0, offline: 0, workload: 0,
  };

  const changeSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const changeStatus = (e) => {
    setStatus(e.target.value);
    setCurrentPage(1);
  };

  const setPage = setCurrentPage;

  const filteredTechnicians = useMemo(() => {
    return technicians.filter((tech) => {
      const matchesSearch =
        !search ||
        tech.name?.toLowerCase().includes(search.toLowerCase()) ||
        tech.email?.toLowerCase().includes(search.toLowerCase()) ||
        tech.location?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = status === 'all' || tech.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [technicians, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredTechnicians.length / pageSize));

    const visibleTechnicians = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTechnicians.slice(start, start + pageSize);
  }, [filteredTechnicians, currentPage, pageSize]);

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header & Refresh */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-1)' }}>
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--pb-text-1)' }}>Technicians</h1>
            <p className="text-sm" style={{ color: 'var(--pb-text-2)' }}>Manage field team availability, location tracking, and workload.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-secondary"
        >
          <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh Data
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--pb-raised)' }}></div>
              <div className="h-8 rounded w-1/2" style={{ backgroundColor: 'var(--pb-raised)' }}></div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card text-center py-10">
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>
            Failed to load technicians.
          </p>
          <button type="button" onClick={() => refetch()} className="btn-secondary mt-4">
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Staff" value={statistics.total} icon={Users} iconClass="p-2 rounded-lg" />
            <StatCard title="Available" value={statistics.available} icon={CheckCircle2} iconClass="bg-emerald-50 p-2 text-emerald-600 rounded-lg" />
            <StatCard title="Busy" value={statistics.busy} icon={Clock3} iconClass="bg-amber-50 p-2 text-amber-600 rounded-lg" />
            <StatCard title="Offline" value={statistics.offline} icon={Wifi} iconClass="p-2 rounded-lg" />
            <StatCard title="Total Jobs" value={statistics.workload} icon={Activity} iconClass="bg-blue-50 p-2 text-blue-600 rounded-lg" />
          </div>

          {/* Directory & Filters */}
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b flex flex-col sm:flex-row gap-4" style={{ borderColor: 'var(--pb-border)', backgroundColor: 'var(--pb-raised)' }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--pb-text-3)' }} />
                <input
                  type="text"
                  placeholder="Filter by name, location, or contact..."
                  value={search}
                  onChange={changeSearch}
                  className="input pl-10"
                />
              </div>
              <select
                value={status}
                onChange={changeStatus}
                className="input sm:w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="text-xs font-semibold uppercase tracking-wider" style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-3)' }}>
                  <tr>
                    <th className="px-6 py-4">Technician</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">Workload</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'var(--pb-border)' }}>
                  {visibleTechnicians.length > 0 ? (
                    visibleTechnicians.map((tech) => (
                      <tr key={tech.id} className="hover:[background-color:var(--pb-raised)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-2)' }}>
                              {getInitials(tech.name)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold" style={{ color: 'var(--pb-text-1)' }}>{tech.name}</div>
                              <div className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{tech.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={tech.status} /></td>
                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--pb-text-2)' }}>{tech.location}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold" style={{ color: 'var(--pb-text-1)' }}>{tech.workload}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-sm" style={{ color: 'var(--pb-text-3)' }}>
                        No technicians found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--pb-border)', backgroundColor: 'var(--pb-raised)' }}>
              <p className="text-xs font-medium italic" style={{ color: 'var(--pb-text-3)' }}>
                Showing page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary px-4 py-2 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
