import { useState, useEffect, useMemo } from 'react';
import {
  Users, RefreshCw, CheckCircle2, Clock3, Wifi, Activity,
  Search,
} from 'lucide-react';
import StatCard from '../../components/dashboard/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import { getInitials } from '../../utils/formatDate';
import { getTechnicians } from '../../api/technicians.api';

export default function TechniciansPage() {
  const [technicians, setTechnicians] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0, available: 0, busy: 0, offline: 0, workload: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const refresh = async () => {
    setIsLoading(true);
    try {
      const response = await getTechnicians();
      if (response.success) {
        setTechnicians(response.data.technicians || []);
        setStatistics(response.data.statistics || {
          total: 0, available: 0, busy: 0, offline: 0, workload: 0,
        });
      }
    } catch (error) {
      console.error('Failed to load technicians:', error);
    } finally {
      setIsLoading(false);
    }
  };

        useEffect(() => {
    refresh();
  }, []);

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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Technicians</h1>
            <p className="text-sm text-slate-500">Manage field team availability, location tracking, and workload.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={refresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh Data
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Statistics Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Staff" value={statistics.total} icon={Users} iconClass="bg-slate-100 p-2 text-slate-600 rounded-lg" />
            <StatCard title="Available" value={statistics.available} icon={CheckCircle2} iconClass="bg-emerald-50 p-2 text-emerald-600 rounded-lg" />
            <StatCard title="Busy" value={statistics.busy} icon={Clock3} iconClass="bg-amber-50 p-2 text-amber-600 rounded-lg" />
            <StatCard title="Offline" value={statistics.offline} icon={Wifi} iconClass="bg-slate-100 p-2 text-slate-400 rounded-lg" />
            <StatCard title="Total Jobs" value={statistics.workload} icon={Activity} iconClass="bg-blue-50 p-2 text-blue-600 rounded-lg" />
          </div>

          {/* Directory & Filters */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 bg-slate-50/30">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, location, or contact..."
                  value={search}
                  onChange={changeSearch}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                />
              </div>
              <select
                value={status}
                onChange={changeStatus}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Offline</option>
              </select>
            </div>


            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Technician</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Location</th>
                    <th className="px-6 py-4 text-right">Workload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleTechnicians.length > 0 ? (
                    visibleTechnicians.map((tech) => (
                      <tr key={tech.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {getInitials(tech.name)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{tech.name}</div>
                              <div className="text-xs text-slate-500">{tech.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={tech.status} /></td>
                        <td className="px-6 py-4 text-sm text-slate-600">{tech.location}</td>
                        <td className="px-6 py-4 text-sm text-right font-bold text-slate-800">{tech.workload}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500 text-sm">
                        No technicians found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-500 font-medium italic">
                Showing page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-30 bg-white hover:bg-slate-50 transition-all shadow-sm"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-4 py-2 text-xs font-semibold border border-slate-200 rounded-lg disabled:opacity-30 bg-white hover:bg-slate-50 transition-all shadow-sm"
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
