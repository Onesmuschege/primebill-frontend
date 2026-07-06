import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminLayout from '../components/layout/AdminLayout'

// Auth
import Login from '../pages/auth/Login'
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

// Support
import TicketList from '../pages/tickets/TicketList'
import TicketDetail from '../pages/tickets/TicketDetail'
import SmsDashboard from '../pages/sms/SmsDashboard'

// Network
import RouterList from '../pages/routers/RouterList'
import InventoryList from '../pages/inventory/InventoryList'

// Finance
import FinanceOverview from '../pages/finance/FinanceOverview'
import Reports from '../pages/reports/Reports'
import Analytics from '../pages/analytics/Analytics'

// Marketing
import LoyaltyPoints from '../pages/loyalty/LoyaltyPoints'
import VoucherList from '../pages/vouchers/VoucherList'

// Admin
import AdminUsers from '../pages/admin/AdminUsers'
import AdminRoles from '../pages/admin/AdminRoles'
import SystemLogs from '../pages/logs/SystemLogs'
import Settings from '../pages/settings/Settings'

// Public Portal
import CaptivePortal from '../pages/portal/CaptivePortal'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/captive" element={<CaptivePortal />} />
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

        {/* Support */}
        <Route path="/tickets" element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/sms" element={<SmsDashboard />} />

        {/* Network */}
        <Route path="/routers" element={<RouterList />} />
        <Route path="/inventory" element={<InventoryList />} />

        {/* Analytics */}
        <Route path="/finance" element={<FinanceOverview />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/analytics" element={<Analytics />} />

        {/* Engagement */}
        <Route path="/loyalty" element={<LoyaltyPoints />} />

        {/* System */}
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/roles" element={<AdminRoles />} />
        <Route path="/logs" element={<SystemLogs />} />
        <Route path="/settings" element={<Settings />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}