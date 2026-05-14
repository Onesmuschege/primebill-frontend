import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getClient,
  updateClient,
  suspendClient,
  activateClient,
  getClientAccounts,
  getClientInvoices,
  getClientPayments,
  getClientTickets,
  createClientAccount,
} from '../../api/clients.api'
import { getPlans } from '../../api/plans.api'
import Modal from '../../components/common/Modal'
import { clientStatusBadge } from '../../utils/statusColors'
import { formatDate, formatDateTime } from '../../utils/formatDate'
import { formatKES } from '../../utils/formatCurrency'
import {
  ArrowLeft, UserX, UserCheck, Edit2, Plus,
  Wifi, FileText, CreditCard, Ticket,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Spinner from '../../components/common/Spinner'

const TABS = [
  { key: 'accounts',  label: 'Internet Accounts', icon: Wifi },
  { key: 'invoices',  label: 'Invoices',           icon: FileText },
  { key: 'payments',  label: 'Payments',           icon: CreditCard },
  { key: 'tickets',   label: 'Tickets',            icon: Ticket },
]

export default function ClientDetail() {
  const { id }      = useParams()
  const navigate    = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab]       = useState('accounts')
  const [showEdit, setShowEdit]         = useState(false)
  const [showAccount, setShowAccount]   = useState(false)
  const [editForm, setEditForm]         = useState(null)
  const [accountForm, setAccountForm]   = useState({
    plan_id: '', username: '', password: '', type: 'pppoe',
  })

  // ── Queries ──────────────────────────────────────────
  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => getClient(id).then(r => r.data.data),
    onSuccess: (data) => setEditForm(data),
  })

  const { data: accounts } = useQuery({
    queryKey: ['client-accounts', id],
    queryFn: () => getClientAccounts(id).then(r => r.data.data),
    enabled: activeTab === 'accounts',
  })

  const { data: invoices } = useQuery({
    queryKey: ['client-invoices', id],
    queryFn: () => getClientInvoices(id).then(r => r.data.data),
    enabled: activeTab === 'invoices',
  })

  const { data: payments } = useQuery({
    queryKey: ['client-payments', id],
    queryFn: () => getClientPayments(id).then(r => r.data.data),
    enabled: activeTab === 'payments',
  })

  const { data: tickets } = useQuery({
    queryKey: ['client-tickets', id],
    queryFn: () => getClientTickets(id).then(r => r.data.data),
    enabled: activeTab === 'tickets',
  })

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => getPlans().then(r => r.data.data),
    enabled: showAccount,
  })

  // ── Mutations ─────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (data) => updateClient(id, data),
    onSuccess: () => {
      toast.success('Client updated!')
      setShowEdit(false)
      queryClient.invalidateQueries(['client', id])
      queryClient.invalidateQueries(['clients'])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })

  const suspendMutation = useMutation({
    mutationFn: () => suspendClient(id),
    onSuccess: () => { toast.success('Client suspended'); queryClient.invalidateQueries(['client', id]) },
  })

  const activateMutation = useMutation({
    mutationFn: () => activateClient(id),
    onSuccess: () => { toast.success('Client activated'); queryClient.invalidateQueries(['client', id]) },
  })

  const addAccountMutation = useMutation({
    mutationFn: (data) => createClientAccount(id, data),
    onSuccess: () => {
      toast.success('Account created!')
      setShowAccount(false)
      setAccountForm({ plan_id: '', username: '', password: '', type: 'pppoe' })
      queryClient.invalidateQueries(['client-accounts', id])
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create account'),
  })

  if (isLoading) return <div className="py-20"><Spinner size="lg" /></div>

  const infoFields = [
    { label: 'Phone',     value: client?.phone },
    { label: 'Email',     value: client?.email || '—' },
    { label: 'ID Number', value: client?.id_number || '—' },
    { label: 'Address',   value: client?.address || '—' },
    { label: 'County',    value: client?.county || '—' },
    { label: 'Town',      value: client?.town || '—' },
    { label: 'Joined',    value: formatDate(client?.created_at) },
  ]

  return (
    <div className="space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/clients')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
        <ArrowLeft size={16} /> Back to Clients
      </button>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
              {client?.first_name?.[0]}{client?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold">{client?.first_name} {client?.last_name}</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${clientStatusBadge(client?.status)}`}>
                {client?.status}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditForm({ ...client }); setShowEdit(true) }}
              className="btn-secondary flex items-center gap-1 text-sm"
            >
              <Edit2 size={14} /> Edit
            </button>
            {client?.status === 'active' ? (
              <button
                onClick={() => suspendMutation.mutate()}
                disabled={suspendMutation.isPending}
                className="btn-secondary flex items-center gap-1 text-sm text-orange-600"
              >
                <UserX size={14} /> Suspend
              </button>
            ) : (
              <button
                onClick={() => activateMutation.mutate()}
                disabled={activateMutation.isPending}
                className="btn-secondary flex items-center gap-1 text-sm text-green-600"
              >
                <UserCheck size={14} /> Activate
              </button>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t">
          {infoFields.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b flex gap-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ── Accounts Tab ── */}
      {activeTab === 'accounts' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowAccount(true)} className="btn-primary flex items-center gap-2">
              <Plus size={15} /> Add Account
            </button>
          </div>
          {accounts?.length === 0 && (
            <div className="card text-center text-gray-400 py-10">No internet accounts yet.</div>
          )}
          {accounts?.map(acc => (
            <div key={acc.id} className="card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-50 rounded-lg text-primary-600"><Wifi size={18} /></div>
                <div>
                  <p className="font-semibold">{acc.username}</p>
                  <p className="text-xs text-gray-400">{acc.type?.toUpperCase()} · {acc.plan?.name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary-600">{formatKES(acc.plan?.price)}<span className="text-xs text-gray-400">/mo</span></p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${acc.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {acc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Invoices Tab ── */}
      {activeTab === 'invoices' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Invoice #', 'Amount', 'Status', 'Due Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {invoices?.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No invoices found.</td></tr>
              )}
              {invoices?.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{inv.invoice_number}</td>
                  <td className="px-4 py-3">{formatKES(inv.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                        inv.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(inv.due_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Payments Tab ── */}
      {activeTab === 'payments' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Amount', 'Method', 'Reference', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments?.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No payments found.</td></tr>
              )}
              {payments?.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-primary-600">{formatKES(p.amount)}</td>
                  <td className="px-4 py-3 uppercase text-xs">{p.method}</td>
                  <td className="px-4 py-3 text-gray-500">{p.mpesa_code || p.reference || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tickets Tab ── */}
      {activeTab === 'tickets' && (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['#', 'Subject', 'Priority', 'Status', 'Created'].map(h => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {tickets?.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No tickets found.</td></tr>
              )}
              {tickets?.map(t => (
                <tr
                  key={t.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/tickets/${t.id}`)}
                >
                  <td className="px-4 py-3 text-gray-400">#{t.id}</td>
                  <td className="px-4 py-3 font-medium">{t.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                      ${t.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        t.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-600'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className="badge-inactive">{t.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{formatDateTime(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Edit Client Modal ── */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Client" size="lg">
        {editForm && (
          <form
            onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(editForm) }}
            className="space-y-4"
          >
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    value={editForm[key] || ''}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="input"
                    required={required}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
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
        <form
          onSubmit={(e) => { e.preventDefault(); addAccountMutation.mutate(accountForm) }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan *</label>
            <select
              value={accountForm.plan_id}
              onChange={(e) => setAccountForm({ ...accountForm, plan_id: e.target.value })}
              className="input"
              required
            >
              <option value="">Select a plan...</option>
              {plans?.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {formatKES(p.price)}/mo</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={accountForm.type}
              onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
              className="input"
            >
              <option value="pppoe">PPPoE</option>
              <option value="hotspot">Hotspot</option>
              <option value="static">Static</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input
              value={accountForm.username}
              onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
              className="input"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              value={accountForm.password}
              onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
              className="input"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
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