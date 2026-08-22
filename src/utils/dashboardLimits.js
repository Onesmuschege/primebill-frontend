/**
 * Per-widget server-side limits for dashboard collection widgets.
 *
 * Each dashboard widget declares the number of rows its layout can sensibly
 * display — there is deliberately NO universal project-wide number. The value
 * is BOTH the `limit`/`per_page` sent to the API and the defensive render cap
 * applied by DashboardListSection, so a widget can never render more than its
 * budget even if an endpoint ignores the requested limit.
 */
export const DASHBOARD_LIMITS = {
  platformActivity: 8,    // compact feed of audit events
  platformTenants: 8,     // tenant table preview on the platform overview
  topDownloaders: 5,      // leaderboard — short by design
  nocDevices: 8,          // device health list
  nocAlerts: 6,           // open alerts list
  recentTransactions: 10, // wallet activity feed
}
