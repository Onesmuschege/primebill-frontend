import axiosInstance from './axiosInstance';

/**
 * System Logs API
 * Covers the audit trail described in the project README:
 * "System Logs — Full audit trail of all admin actions"
 *
 * Expects a Laravel endpoint backed by the `system_logs` table, e.g.:
 *   GET  /api/logs            -> paginated list (filterable)
 *   GET  /api/logs/{id}       -> single log entry
 *   GET  /api/logs/export     -> CSV export (blob)
 *
 * If your backend route differs (e.g. /api/system-logs), update the
 * paths below to match routes/api.php.
 */

const logsApi = {
  /**
   * Fetch a paginated list of system logs.
   * @param {Object} params - { page, per_page, search, action, date_from, date_to }
   */
  getLogs: (params = {}) => axiosInstance.get('/logs', { params }),

  /**
   * Fetch a single log entry by id.
   */
  getLogById: (id) => axiosInstance.get(`/logs/${id}`),

    /**
   * Export logs matching the current filters as CSV.
   */
  exportLogs: (params = {}) =>
    axiosInstance.get('/logs/export', {
      params,
      responseType: 'blob',
    }),

  /**
   * Log volume / breakdown statistics.
   * Backend: LogController::stats().
   */
  getStats: (params = {}) => axiosInstance.get('/logs/stats', { params }),
};

export default logsApi;