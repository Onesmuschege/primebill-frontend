import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminLayout from '../components/layout/AdminLayout'
import PlatformLayout from '../layouts/PlatformLayout'

// Auth
import Login from '../pages/auth/Login'
import TenantSignup from '../pages/auth/TenantSignup'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import Unauthorized from '../pages/auth/Unauthorized'

// Dashboard
import Dashboard from '../pages/dashboard/Dashboard'

// Clients
import ClientList from '../pages/clients/ClientList'
import ClientDetail from '../pages/clients/ClientDetail'

// Plans
import PlanList from '../pages/plans/PlanList'
import FupManagement from '../pages/fup/FupManagement'

// Billing
import InvoiceList from '../pages/invoices/InvoiceList'
import PaymentList from '../pages/payments/PaymentList'
import PaymentAllocationsPage from '../pages/payment-allocations/PaymentAllocationsPage'

// Support
import TicketList from '../pages/tickets/TicketList'
import TicketDetail from '../pages/tickets/TicketDetail'
import SmsDashboard from '../pages/sms/SmsDashboard'

// Network
import RouterList from '../pages/routers/RouterList'
import InventoryList from '../pages/inventory/InventoryList'
import RadiusPage from '../pages/radius/RadiusPage'

// NOC
import NocDashboard from '../pages/noc/NocDashboard'
import NocDevices from '../pages/noc/NocDevices'
import NocAlerts from '../pages/noc/NocAlerts'
import NocLinks from '../pages/noc/NocLinks'

// Fiber / OLT
import OltList from '../pages/fiber/OltList'
import OltDetail from '../pages/fiber/OltDetail'
import FiberMap from '../pages/fiber/FiberMap'

// Field Operations
import WorkOrdersPage from '../pages/work-orders/WorkOrdersPage'

// Subscription (PrimeBill licensing)
import SubscriptionPage from '../pages/subscription/SubscriptionPage'
import TenantSubscriptionPage from '../pages/subscription/TenantSubscriptionPage'

// Finance
import FinanceOverview from '../pages/finance/FinanceOverview'
import Reports from '../pages/reports/Reports'
import Analytics from '../pages/analytics/Analytics'

// Marketing
import LoyaltyPoints from '../pages/loyalty/LoyaltyPoints'
import VoucherList from '../pages/vouchers/VoucherList'

// Network operations (dedicated pages previously missing entirely)
import IpamPage from '../pages/ipam/IpamPage'
import IncidentsPage from '../pages/incidents/IncidentsPage'

// Finance / operating costs
import ExpendituresPage from '../pages/expenditures/ExpendituresPage'

// Security Center (API keys, sessions, login history, security events)
import SecurityCenter from '../pages/security/SecurityCenter'

// Referrals / Commissions / MFA (expanded backend parity)
import ReferralsPage from '../pages/referrals/ReferralsPage'
import CommissionsPage from '../pages/commissions/CommissionsPage'
import MfaSettings from '../pages/mfa/MfaSettings'

// Leads (CRM)
import LeadList from '../pages/leads/LeadList'
import LeadDetail from '../pages/leads/LeadDetail'
import ProspectList from '../pages/prospects/ProspectList'
import ProspectDetail from '../pages/prospects/ProspectDetail'

// Admin
import AdminUsers from '../pages/admin/AdminUsers'
import AdminRoles from '../pages/admin/AdminRoles'
import SystemLogs from '../pages/logs/SystemLogs'
import Settings from '../pages/settings/Settings'
import CatalogPage from '../pages/catalog/CatalogPage'

// Platform (cross-tenant PrimeBill-operator view)
import PlatformDashboard from '../pages/platform/PlatformDashboard'
import PlatformTenants from '../pages/platform/PlatformTenants'
import PlatformTenantDetail from '../pages/platform/PlatformTenantDetail'
import PlatformSubscriptions from '../pages/platform/PlatformSubscriptions'
import PlatformSubscriptionAnalytics from '../pages/platform/PlatformSubscriptionAnalytics'
import PlatformAuditLog from '../pages/platform/PlatformAuditLog'

// Public Portal
import CaptivePortal from '../pages/portal/CaptivePortal'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<TenantSignup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/captive/:tenantSlug" element={<CaptivePortal />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected */}
      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Subscribers */}
        <Route path="/clients" element={<ClientList />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/plans" element={<PlanList />} />
        <Route path="/vouchers" element={<VoucherList />} />
        <Route path="/fup" element={<FupManagement />} />

        {/* Billing */}
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/payments" element={<PaymentList />} />
        <Route path="/payment-allocations" element={<PaymentAllocationsPage />} />

        {/* Support */}
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/sms" element={<SmsDashboard />} />

{/* Network */}
        <Route path="/routers" element={<RouterList />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/radius" element={<RadiusPage />} />
        <Route path="/ipam" element={<IpamPage />} />
        <Route path="/incidents" element={<IncidentsPage />} />

{/* NOC */}
        <Route path="/noc" element={<NocDashboard />} />
        <Route path="/noc/devices" element={<NocDevices />} />
        <Route path="/noc/alerts" element={<NocAlerts />} />
        <Route path="/noc/links" element={<NocLinks />} />

        {/* Fiber / OLT */}
        <Route path="/fiber/olts" element={<OltList />} />
        <Route path="/fiber/olts/:id" element={<OltDetail />} />
        <Route path="/fiber/map" element={<FiberMap />} />

        {/* Field Operations */}
        <Route path="/work-orders" element={<WorkOrdersPage />} />

        {/* Subscription (PrimeBill licensing) */}
        <Route path="/subscription/plans" element={<SubscriptionPage />} />
        <Route path="/subscription/my" element={<TenantSubscriptionPage />} />

        {/* Analytics */}
        <Route path="/finance" element={<FinanceOverview />} />
        <Route path="/expenditures" element={<ExpendituresPage />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* Leads (CRM) */}
        <Route path="/leads" element={<LeadList />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/prospects" element={<ProspectList />} />
        <Route path="/prospects/:id" element={<ProspectDetail />} />

        {/* Engagement */}
        <Route path="/loyalty" element={<LoyaltyPoints />} />

        {/* System */}
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/roles" element={<AdminRoles />} />
        <Route path="/logs" element={<SystemLogs />} />
                <Route path="/settings" element={<Settings />} />
        <Route path="/security" element={<SecurityCenter />} />
        <Route path="/referrals" element={<ReferralsPage />} />
        <Route path="/commissions" element={<CommissionsPage />} />
        <Route path="/mfa" element={<MfaSettings />} />
        <Route
          path="/catalog"
          element={
            <ProtectedRoute minimumRole="admin">
              <CatalogPage />
            </ProtectedRoute>
          }
        />

        <Route path="/platform" element={<Navigate to="/platform" replace />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>

      {/* PLATFORM CONSOLE — a dedicated shell OUTSIDE the tenant AdminLayout.
          Requires auth AND users.is_platform_admin (requirePlatformAdmin).
          Platform admins are PrimeBill's own cross-tenant operators — they
          never use the tenant sidebar. Every /platform/* route lives here,
          behind both the Sanctum (`auth`) guard enforced by the backend's
          platform_admin middleware AND the client-side platform-admin guard. */}
      <Route
        element={
          <ProtectedRoute requirePlatformAdmin>
            <PlatformLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/platform" element={<PlatformDashboard />} />
        <Route path="/platform/tenants" element={<PlatformTenants />} />
        <Route path="/platform/tenants/:id" element={<PlatformTenantDetail />} />
        <Route path="/platform/subscriptions" element={<PlatformSubscriptions />} />
        {/* Reuses PlatformSubscriptionAnalytics for the platform analytics IA. */}
        <Route path="/platform/analytics" element={<PlatformSubscriptionAnalytics />} />
        <Route path="/platform/audit-log" element={<PlatformAuditLog />} />

        {/* New-scope placeholder areas — Security Center & System Health are
            not yet implemented. PlatformLayout detects these paths and renders
            a clearly-marked placeholder instead of a fabricated page. */}
        <Route path="/platform/security" element={<PlatformDashboard />} />
        <Route path="/platform/system" element={<PlatformDashboard />} />

        {/* Platform catch-all — never fall through to the tenant catch-all. */}
        <Route path="*" element={<Navigate to="/platform" replace />} />
      </Route>
    </Routes>
  )
}