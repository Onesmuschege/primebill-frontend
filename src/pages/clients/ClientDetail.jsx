import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClient, updateClient, suspendClient, activateClient,
  getClientAccounts, getClientInvoices, getClientPayments,
  getClientTickets, createClientAccount,
} from '../../api/clients.api'
import { getPlans } from '../../api/plans.api'
import Modal from '../../components/common/Modal'
import { clientStatusBadge, invoiceStatusBadge, ticketPriorityColor } from '../../utils/statusColors'
import { serviceStateMeta, serviceStateToneClass } from '../../utils/statusMeta'
import { formatDate, formatDateTime } from '../../utils/formatDate'
import { formatKES } from '../../utils/formatCurrency'
import { ArrowLeft, UserX, UserCheck, Edit2, Plus, Wifi, FileText, CreditCard, Ticket, Repeat } from 'lucide-react'
import ServiceNetworkActions from '../../components/clients/ServiceNetworkActions'
import ClientSubscriptions from './ClientSubscriptions'
import toast from 'react-hot-toast'
import Skeleton from '../../components/common/Skeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'

const TABS = [
  { key: 'accounts',      label: 'Internet Accounts', icon: Wifi },
  { key: 'subscriptions', label: 'Subscriptions',      icon: Repeat },
  { key: 'invoices',      label: 'Invoices',           icon: FileText },
  { key: 'payments',      label: 'Payments',           icon: CreditCard },
  { key: 'tickets',       label: 'Tickets',            icon: Ticket },
]

export default function ClientDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab]     = useState('accounts')
  const [showEdit, setShowEdit]       = useState(false)
  const [showAccount, setShowAccount] = useState(false)
      const [editForm, setEditForm]      = useState(null)
  const [accountForm, setAccountForm] = useState({ plan_id: '', username: '', password: '', type: 'pppoe' })

  const { data: client, isLoading, isError, error } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id),
    onSuccess: (data) => setEditForm(data),
    staleTime: 30_000,
  })

  // 404/403 → surface an ErrorState, not a raw error
  const notFoundError = error?.response?.status === 404
  const forbiddenError = error?.response?.status === 403

      const { data: accounts } = useQuery({ queryKey: ['client-accounts', id], queryFn: () => getClientAccounts(id), enabled: activeTab === 'accounts' })
  const { data: invoices } = useQuery({ queryKey: ['client-invoices', id], queryFn: () => getClientInvoices(id), enabled: activeTab === 'invoices' })
  const { data: payments } = useQuery({ queryKey: ['client-payments', id], queryFn: () => getClientPayments(id), enabled: activeTab === 'payments' })
  const { data: tickets }  = useQuery({ queryKey: ['client-tickets', id], queryFn: () => getClientTickets(id), enabled: activeTab === 'tickets' })
  const { data: plansData } = useQuery({ queryKey: ['plans'], queryFn: () => getPlans(), enabled: showAccount })

  // unwrap — each relationship query returns { data, meta } (unwrapList)
  const plans = plansData?.data ?? plansData ?? []
  const accountsList = Array.isArray(accounts?.data) ? accounts.data : (Array.isArray(accounts) ? accounts : [])
  const invoicesList = Array.isArray(invoices?.data) ? invoices.data : (Array.isArray(invoices) ? invoices : [])
  const paymentsList = Array.isArray(payments?.data) ? payments.data : (Array.isArray(payments) ? payments : [])
  const ticketsList  = Array.isArray(tickets?.data)  ? tickets.data  : (Array.isArray(tickets)  ? tickets  : [])

  const updateMutation = useMutation({
    mutationFn: (data) => updateClient(id, data),
    onSuccess: () => { toast.success('Client updated!'); setShowEdit(false); queryClient.invalidateQueries(['client', id]); queryClient.invalidateQueries(['clients']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })
  const suspendMutation  = useMutation({ mutationFn: () => suspendClient(id),  onSuccess: () => { toast.success('Client suspended');  queryClient.invalidateQueries(['client', id]) } })
  const activateMutation = useMutation({ mutationFn: () => activateClient(id), onSuccess: () => { toast.success('Client activated'); queryClient.invalidateQueries(['client', id]) } })
  const addAccountMutation = useMutation({
    mutationFn: (data) => createClientAccount(id, data),
    onSuccess: () => { toast.success('Account created!'); setShowAccount(false); setAccountForm({ plan_id: '', username: '', password: '', type: 'pppoe' }); queryClient.invalidateQueries(['client-accounts', id]) },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create account'),
  })

    if (notFoundError) {
    return (
      <ErrorState
        title="Client not found"
        message="The requested client does not exist or you don't have access to it."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['client', id] })}
      />
    )
  }
  if (forbiddenError) {
    return (
      <ErrorState
        title="Access denied"
        message="You don't have permission to view this client."
      />
    )
  }
  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? 'Failed to load client'}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['client', id] })}
      />
    )
  }

  if (isLoading) return <Skeleton lines={8} />
  if (!client) return <ErrorState title="Client not found" message="No client data returned." />

  const infoFields = [
    { label: 'Phone',     value: client?.phone },
    { label: 'Email',     value: client?.email || '—' },
    { label: 'ID Number', value: client?.id_number || '—' },
    { label: 'Address',   value: client?.address || '—' },
    { label: 'County',    value: client?.county || '—' },
    { label: 'Town',      value: client?.town || '—' },
    { label: 'Joined',    value: formatDate(client?.created_at) },
  ]

  const thBg = { backgroundColor: 'var(--pb-raised)', color: 'var(--pb-text-3)' }
  const tdStyle = { color: 'var(--pb-text-2)', borderBottom: '1px solid var(--pb-border)' }

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/clients')}
        className="flex items-center gap-1.5 text-sm transition-colors"
        style={{ color: 'var(--pb-text-3)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#60a5fa'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--pb-text-3)'}
      >
        <ArrowLeft size={15} /> Back to Clients
      </button>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
              {client?.first_name?.[0]}{client?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>
                {client?.first_name} {client?.last_name}
              </h2>
              <span className={clientStatusBadge(client?.status)}>{client?.status}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditForm({ ...client }); setShowEdit(true) }} className="btn-secondary">
              <Edit2 size={14} /> Edit
            </button>
            {client?.status === 'active' ? (
              <button onClick={() => suspendMutation.mutate()} disabled={suspendMutation.isPending}
                className="btn-secondary" style={{ color: '#fbbf24' }}>
                <UserX size={14} /> Suspend
              </button>
            ) : (
              <button onClick={() => activateMutation.mutate()} disabled={activateMutation.isPending}
                className="btn-secondary" style={{ color: '#34d399' }}>
                <UserCheck size={14} /> Activate
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 pt-5 grid grid-cols-2 md:grid-cols-4 gap-4"
          style={{ borderTop: '1px solid var(--pb-border)' }}>
          {infoFields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5"
                style={{ color: 'var(--pb-text-3)' }}>{label}</p>
              <p className="text-sm font-medium" style={{ color: 'var(--pb-text-1)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1" style={{ borderBottom: '1px solid var(--pb-border)' }}>
                {TABS.map(({ key, label, icon: Icon }) => ( // eslint-disable-line no-unused-vars
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={activeTab === key
              ? { borderColor: '#2563eb', color: '#60a5fa' }
              : { borderColor: 'transparent', color: 'var(--pb-text-3)' }}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── Accounts Tab ── */}
      {activeTab === 'accounts' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowAccount(true)} className="btn-primary">
              <Plus size={14} /> Add Account
            </button>
          </div>
                    {accountsList.length === 0 && (
            <div className="card text-center py-10" style={{ color: 'var(--pb-text-3)' }}>No internet accounts yet.</div>
          )}
                    {accountsList.map(acc => (
            <div key={acc.id} className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(37,99,235,0.1)' }}>
                    <Wifi size={18} style={{ color: '#60a5fa' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--pb-text-1)' }}>
                      <Link to={`/subscribers/services/${acc.id}`} className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded">
                        {acc.username}
                      </Link>
                    </p>
                    <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>{acc.type?.toUpperCase()} · {acc.plan?.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold" style={{ color: '#60a5fa' }}>{formatKES(acc.plan?.price)}<span className="text-xs font-normal" style={{ color: 'var(--pb-text-3)' }}>/mo</span></p>
                  <Link to={`/subscribers/services/${acc.id}`} className={`badge ${serviceStateToneClass(acc.service_state || acc.status)}`} title="Open Service 360 workspace">
                    {serviceStateMeta(acc.service_state || acc.status).label} ↗
                  </Link>
                </div>
              </div>
              <div className="mt-3" style={{ borderTop: '1px solid var(--pb-border)', paddingTop: '0.75rem' }}>
                <ServiceNetworkActions accountId={acc.id} onChanged={() => queryClient.invalidateQueries(['client-accounts', id])} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Subscriptions Tab ── */}
      {activeTab === 'subscriptions' && (
        <ClientSubscriptions clientId={id} />
      )}

      {/* ── Invoices Tab ── */}
      {activeTab === 'invoices' && (
        <div className="section overflow-hidden">
          <table className="table w-full text-sm">
            <thead><tr>
              {['Invoice #', 'Amount', 'Status', 'Due Date'].map(h => (
                <th key={h} style={thBg}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
                            {!invoicesList.length && <tr><td colSpan={4} className="px-4 py-10 text-center" style={{ color: 'var(--pb-text-3)' }}>No invoices found.</td></tr>}
              {invoicesList.map(inv => (
                <tr key={inv.id}>
                  <td style={tdStyle} className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                  <td style={tdStyle} className="px-4 py-3">{formatKES(inv.total)}</td>
                  <td style={tdStyle} className="px-4 py-3"><span className={invoiceStatusBadge(inv.status)}>{inv.status}</span></td>
                  <td style={{ ...tdStyle, color: 'var(--pb-text-3)' }} className="px-4 py-3">{formatDate(inv.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Payments Tab ── */}
      {activeTab === 'payments' && (
        <div className="section overflow-hidden">
          <table className="table w-full text-sm">
            <thead><tr>
              {['Amount', 'Method', 'Reference', 'Date'].map(h => <th key={h} style={thBg}>{h}</th>)}
            </tr></thead>
            <tbody>
                            {!paymentsList.length && <tr><td colSpan={4} className="px-4 py-10 text-center" style={{ color: 'var(--pb-text-3)' }}>No payments found.</td></tr>}
              {paymentsList.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-bold" style={{ color: '#60a5fa', borderBottom: '1px solid var(--pb-border)' }}>{formatKES(p.amount)}</td>
                  <td className="px-4 py-3 text-xs font-semibold uppercase" style={tdStyle}>{p.method}</td>
                  <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{p.mpesa_code || p.reference || '—'}</td>
                  <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tickets Tab ── */}
      {activeTab === 'tickets' && (
        <div className="section overflow-hidden">
          <table className="table w-full text-sm">
            <thead><tr>
              {['#', 'Subject', 'Priority', 'Status', 'Created'].map(h => <th key={h} style={thBg}>{h}</th>)}
            </tr></thead>
            <tbody>
                            {!ticketsList.length && <tr><td colSpan={5} className="px-4 py-10 text-center" style={{ color: 'var(--pb-text-3)' }}>No tickets found.</td></tr>}
              {ticketsList.map(t => (
                <tr key={t.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/tickets/${t.id}`)}>
                  <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>#{t.id}</td>
                  <td className="px-4 py-3 font-medium" style={tdStyle}>{t.subject}</td>
                  <td className="px-4 py-3" style={tdStyle}><span className={ticketPriorityColor(t.priority)}>{t.priority}</span></td>
                  <td className="px-4 py-3" style={tdStyle}><span className="badge badge-inactive">{t.status}</span></td>
                  <td className="px-4 py-3" style={{ ...tdStyle, color: 'var(--pb-text-3)' }}>{formatDateTime(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit Modal ── */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Client" size="lg">
        {editForm && (
          <form onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editForm) }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'first_name', label: 'First Name', required: true },
                { key: 'last_name',  label: 'Last Name',  required: true },
                { key: 'phone',      label: 'Phone',      required: true },
                { key: 'email',      label: 'Email' },
                { key: 'id_number',  label: 'ID Number' },
                { key: 'address',    label: 'Address' },
                { key: 'county',     label: 'County' },
                { key: 'town',       label: 'Town' },
              ].map(({ key, label, required }) => (
                <div key={key}>
                  <label className="label">{label} {required && <span style={{ color: '#ef4444' }}>*</span>}</label>
                  <input value={editForm[key] || ''} onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })} className="input" required={required} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
              <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Add Account Modal ── */}
      <Modal isOpen={showAccount} onClose={() => setShowAccount(false)} title="Add Internet Account">
        <form onSubmit={(e) => { e.preventDefault(); addAccountMutation.mutate(accountForm) }} className="space-y-4">
          <div>
            <label className="label">Plan *</label>
            <select value={accountForm.plan_id} onChange={(e) => setAccountForm({ ...accountForm, plan_id: e.target.value })} className="input" required>
              <option value="">Select a plan...</option>
              {plans?.map(p => <option key={p.id} value={p.id}>{p.name} — {formatKES(p.price)}/mo</option>)}
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select value={accountForm.type} onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })} className="input">
              <option value="pppoe">PPPoE</option>
              <option value="hotspot">Hotspot</option>
              <option value="static">Static</option>
            </select>
          </div>
          <div>
            <label className="label">Username *</label>
            <input value={accountForm.username} onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })} className="input" required />
          </div>
          <div>
            <label className="label">Password *</label>
            <input type="password" value={accountForm.password} onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })} className="input" required />
          </div>
          <div className="flex justify-end gap-3 pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
            <button type="button" onClick={() => setShowAccount(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={addAccountMutation.isPending} className="btn-primary">
              {addAccountMutation.isPending ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}