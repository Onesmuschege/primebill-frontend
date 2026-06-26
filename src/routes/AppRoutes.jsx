import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import AdminLayout from '../components/layout/AdminLayout'

// Auth pages
import Login          from '../pages/auth/Login'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword  from '../pages/auth/ResetPassword'
import Unauthorized   from '../pages/auth/Unauthorized'

// App pages
import Dashboard       from '../pages/dashboard/Dashboard'
import ClientList      from '../pages/clients/ClientList'
import ClientDetail    from '../pages/clients/ClientDetail'
import PlanList        from '../pages/plans/PlanList'
import InvoiceList     from '../pages/invoices/InvoiceList'
import PaymentList     from '../pages/payments/PaymentList'
import TicketList      from '../pages/tickets/TicketList'
import TicketDetail    from '../pages/tickets/TicketDetail'
import SmsDashboard    from '../pages/sms/SmsDashboard'
import RouterList      from '../pages/routers/RouterList'
import InventoryList   from '../pages/inventory/InventoryList'
import FinanceOverview from '../pages/finance/FinanceOverview'
import Reports         from '../pages/reports/Reports'
import SystemLogs      from '../pages/logs/SystemLogs'
import Settings        from '../pages/settings/Settings'

// BrowserRouter  — moved to main.jsx (AuthContext uses useNavigate, requires Router ancestor)
// AuthProvider   — moved to main.jsx (same reason — must be inside BrowserRouter)

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public routes ─────────────────────────────────────────────── */}
      <Route path="/login"           element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/unauthorized"    element={<Unauthorized />} />
      <Route path="/"                element={<Navigate to="/dashboard" replace />} />

      {/* ── Protected app routes ──────────────────────────────────────── */}
      {/*
        Layout route: ProtectedRoute guards the shell, AdminLayout renders
        the sidebar + topnav + <Outlet /> where child routes mount.

        To restrict individual routes by role, wrap the element instead:
          <Route path="/settings" element={
            <ProtectedRoute minimumRole="admin"><Settings /></ProtectedRoute>
          } />
      */}
      <Route element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
        <Route path="/dashboard"   element={<Dashboard />} />
        <Route path="/clients"     element={<ClientList />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/plans"       element={<PlanList />} />
        <Route path="/invoices"    element={<InvoiceList />} />
        <Route path="/payments"    element={<PaymentList />} />
        <Route path="/tickets"     element={<TicketList />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/sms"         element={<SmsDashboard />} />
        <Route path="/routers"     element={<RouterList />} />
        <Route path="/inventory"   element={<InventoryList />} />
        <Route path="/finance"     element={<FinanceOverview />} />
        <Route path="/reports"     element={<Reports />} />
        <Route path="/logs"        element={<SystemLogs />} />
        <Route path="/settings"    element={<Settings />} />
      </Route>
    </Routes>
  )
}