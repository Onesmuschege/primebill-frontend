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
import ServiceDetail from '../pages/clients/ServiceDetail'
import MyWork from '../pages/work/MyWork'
import BillingOperations from '../pages/billing/BillingOperations'

// Plans
import PlanList from '../pages/plans/PlanList'
import FupManagement from '../pages/fup/FupManagement'

// Billing
import InvoiceList from '../pages/invoices/InvoiceList'
import PaymentList from '../pages/payments/PaymentList'
import PaymentAllocationsPage from '../pages/payment-allocations/PaymentAllocationsPage'
import CollectionsPage from '../pages/collections/CollectionsPage'

// Support
import TicketList from '../pages/tickets/TicketList'
import TicketDetail from '../pages/tickets/TicketDetail'
import TicketBoard from '../pages/tickets/TicketBoard'
import SmsDashboard from '../pages/sms/SmsDashboard'

// Network
import RouterList from '../pages/routers/RouterList'
import InventoryList from '../pages/inventory/InventoryList'
import InventoryOperations from '../pages/inventory/InventoryOperations'
import RmaBoard from '../pages/inventory/RmaBoard'
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
import FiberCapacity from '../pages/fiber/FiberCapacity'

// Field Operations
import WorkOrdersPage from '../pages/work-orders/WorkOrdersPage'
import TechniciansPage from '../pages/field-ops/TechniciansPage'
import WorkOrderDetail from '../pages/work-orders/WorkOrderDetail'

// Automation (Release 5 — event-driven OSS/BSS pipeline)
import AutomationIndex from '../pages/automation/AutomationIndex'
import AutomationEvents from '../pages/automation/AutomationEvents'
import AutomationJobs from '../pages/automation/AutomationJobs'
import AutomationFailures from '../pages/automation/AutomationFailures'
import AutomationRules from '../pages/automation/AutomationRules'
import AutomationHistory from '../pages/automation/AutomationHistory'

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
import IncidentBoard from '../pages/incidents/IncidentBoard'

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
import PlatformSecurityCenter from '../pages/platform/PlatformSecurityCenter'
import PlatformSystemHealth from '../pages/platform/PlatformSystemHealth'
import PlatformReports from '../pages/platform/PlatformReports'
import PlatformUsers from '../pages/platform/PlatformUsers'
import PlatformBilling from '../pages/platform/PlatformBilling'

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
          {/* Service 360 workspace (§15): reached from ClientDetail account cards
              and relationship navigation — no sidebar entry by design. Canonical
              §38 structure for new routes; existing flat routes untouched. */}
        <Route path="/subscribers/services/:accountId" element={<ServiceDetail />} />
        <Route path="/plans" element={<PlanList />} />
        <Route path="/vouchers" element={<VoucherList />} />
        <Route path="/fup" element={<FupManagement />} />

        {/* Billing */}
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/payments" element={<PaymentList />} />
        <Route path="/payment-allocations" element={<PaymentAllocationsPage />} />
        <Route
          path="/collections"
          element={
            <ProtectedRoute permission="view collections">
              <CollectionsPage />
            </ProtectedRoute>
          }
        />

        {/* Support */}
        <Route path="/tickets" element={<TicketList />} />
                <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/tickets/board" element={<TicketBoard />} />
        <Route path="/sms" element={<SmsDashboard />} />

        {/* My Work — operational inbox (no sidebar entry; reached via command palette) */}
        <Route path="/my-work" element={<MyWork />} />
        <Route path="/billing-operations" element={<BillingOperations />} />

{/* Network */}
        <Route path="/routers" element={<RouterList />} />
        <Route path="/inventory" element={<InventoryList />} />
        <Route path="/inventory/operations" element={<InventoryOperations />} />
        <Route path="/inventory/rma" element={<RmaBoard />} />
        <Route path="/radius" element={<RadiusPage />} />
        <Route path="/ipam" element={<IpamPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
        <Route path="/incidents/board" element={<IncidentBoard />} />

{/* NOC */}
        <Route path="/noc" element={<NocDashboard />} />
        <Route path="/noc/devices" element={<NocDevices />} />
        <Route path="/noc/alerts" element={<NocAlerts />} />
        <Route path="/noc/links" element={<NocLinks />} />

        {/* Fiber / OLT */}
        <Route path="/fiber/olts" element={<OltList />} />
        <Route path="/fiber/olts/:id" element={<OltDetail />} />
                <Route path="/fiber/map" element={<FiberMap />} />
        <Route path="/fiber/capacity" element={<FiberCapacity />} />

        {/* Field Operations */}
        <Route path="/work-orders" element={<WorkOrdersPage />} />
                <Route path="/work-orders/technicians" element={<TechniciansPage />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetail />} />

        {/* Automation (Release 5) */}
        <Route path="/automation" element={<AutomationIndex />} />
        <Route path="/automation/events" element={<AutomationEvents />} />
        <Route path="/automation/jobs" element={<AutomationJobs />} />
        <Route path="/automation/failures" element={<AutomationFailures />} />
        <Route path="/automation/rules" element={<AutomationRules />} />
        <Route path="/automation/history" element={<AutomationHistory />} />

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
        <Route path="/platform/reports" element={<PlatformReports />} />
        <Route path="/platform/users" element={<PlatformUsers />} />
        <Route path="/platform/billing" element={<PlatformBilling />} />

        <Route path="/platform/security" element={<PlatformSecurityCenter />} />
        <Route path="/platform/system" element={<PlatformSystemHealth />} />

        {/* Platform catch-all — never fall through to the tenant catch-all. */}
        <Route path="*" element={<Navigate to="/platform" replace />} />
      </Route>
    </Routes>
  )
}
