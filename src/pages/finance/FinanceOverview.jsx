import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api/axiosInstance'
import {
  getWalletBalance,
  getWalletTransactions,
  walletDeposit,
  walletWithdraw,
  getCreditNotes,
  createCreditNote,
  getDebitNotes,
  createDebitNote,
  getRefunds,
  createRefund,
  getPaymentPlans,
  createPaymentPlan,
  getTrialBalance,
  verifyLedger,
} from '../../api/finance.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { formatKES } from '../../utils/formatCurrency'
import { formatDateTime, formatDate } from '../../utils/formatDate'
import {
  Wallet, TrendingUp, FilePlus, FileMinus, Undo2, CalendarClock, Scale,
  DollarSign, Plus,
} from 'lucide-react'

const clientName = (r) => {
  const f = r?.client?.first_name ?? ''
  const l = r?.client?.last_name ?? ''
  return ((f + ' ' + l).trim()) || '—'
}

const TAB_DEFS = [
  { key: 'overview',  label: 'Overview',          icon: DollarSign },
  { key: 'wallets',   label: 'Wallets',           icon: Wallet },
  { key: 'credit',    label: 'Credit Notes',      icon: FilePlus },
  { key: 'debit',     label: 'Debit Notes',       icon: FileMinus },
  { key: 'refunds',   label: 'Refunds',           icon: Undo2 },
  { key: 'plans',     label: 'Payment Plans',     icon: CalendarClock },
  { key: 'statement', label: 'Trial Balance',     icon: Scale },
]

export default function FinanceOverview() {
  const [tab, setTab] = useState('overview')
  const [page, setPage] = useState({ credit: 1, debit: 1, refunds: 1, plans: 1 })
  const [clientId, setClientId] = useState('')
  const [modal, setModal] = useState(null) // 'deposit' | 'withdraw' | 'credit' | 'debit' | 'refund' | 'plan'
  const qc = useQueryClient()

  const invalidate = () => qc.invalidateQueries({ queryKey: ['finance'] })

  // ── Overview summary ──────────────────────────────────────────────
  const { data: summary } = useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: () => api.get('/expenditures/summary').then(r => r.data.data),
  })

  const { data: ledgerCheck } = useQuery({
    queryKey: ['finance', 'ledger'],
    queryFn: () => verifyLedger().then(r => r.data.data),
  })

  // ── Wallets ───────────────────────────────────────────────────────
  const walletOn = !!clientId
  const { data: balance } = useQuery({
    queryKey: ['finance', 'wallet', clientId],
    queryFn: () => getWalletBalance(clientId).then(r => r.data.data),
    enabled: walletOn,
  })
  const { data: transactions } = useQuery({
    queryKey: ['finance', 'wallet-tx', clientId],
    queryFn: () => getWalletTransactions(clientId, 20).then(r => r.data.data),
    enabled: walletOn,
  })

  // ── Lists ─────────────────────────────────────────────────────────
  const { data: creditData, isLoading: loadingCredit } = useQuery({
    queryKey: ['finance', 'credit', page.credit],
    queryFn: () => getCreditNotes({ page: page.credit, per_page: 15 }),
  })
  const { data: debitData, isLoading: loadingDebit } = useQuery({
    queryKey: ['finance', 'debit', page.debit],
    queryFn: () => getDebitNotes({ page: page.debit, per_page: 15 }),
  })
  const { data: refundData, isLoading: loadingRefund } = useQuery({
    queryKey: ['finance', 'refunds', page.refunds],
    queryFn: () => getRefunds({ page: page.refunds, per_page: 15 }),
  })
  const { data: planData, isLoading: loadingPlan } = useQuery({
    queryKey: ['finance', 'plans', page.plans],
    queryFn: () => getPaymentPlans({ page: page.plans, per_page: 15 }),
  })
  const { data: trialBalance } = useQuery({
    queryKey: ['finance', 'trial-balance'],
    queryFn: () => getTrialBalance().then(r => r.data.data),
  })

  // ── Mutations ─────────────────────────────────────────────────────
  const deposit = useMutation({
    mutationFn: walletDeposit,
    onSuccess: () => { invalidate(); setModal(null) },
  })
  const withdraw = useMutation({
    mutationFn: walletWithdraw,
    onSuccess: () => { invalidate(); setModal(null) },
  })
  const mkCredit = useMutation({
    mutationFn: createCreditNote,
    onSuccess: () => { invalidate(); setModal(null) },
  })
  const mkDebit = useMutation({
    mutationFn: createDebitNote,
    onSuccess: () => { invalidate(); setModal(null) },
  })
  const refund = useMutation({
    mutationFn: createRefund,
    onSuccess: () => { invalidate(); setModal(null) },
  })
  const plan = useMutation({
    mutationFn: createPaymentPlan,
    onSuccess: () => { invalidate(); setModal(null) },
  })

  const errorMsg = (m) => m.error?.response?.data?.message || null

  const submit = (fn, e) => {
    e.preventDefault()
    const fd = new FormData(e.target)
    fn(Object.fromEntries(fd.entries()))
  }

  const btn = 'px-4 py-2 text-sm font-semibold rounded-lg text-white transition-all'
  const input = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40'

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2">
        {TAB_DEFS.map((tabDef) => {
          const Icon = tabDef.icon
          return (
            <button
              key={tabDef.key}
              onClick={() => setTab(tabDef.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all
                ${tab === tabDef.key ? 'text-white' : ''}`}
              style={tab === tabDef.key
                ? { background: 'linear-gradient(135deg,#2563eb,#06b6d4)', boxShadow: 'var(--shadow-glow-primary)' }
                : { color: 'var(--pb-text-2)', background: 'var(--pb-raised)', border: '1px solid var(--pb-border)' }}
            >
              <Icon size={16} /> {tabDef.label}
            </button>
          )
        })}
      </div>

      {/* ── Overview ──────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Income',      value: summary?.income,      icon: TrendingUp,  color: 'text-green-600',  bg: 'bg-green-50' },
              { label: 'Expenditure', value: summary?.expenditure, icon: FileMinus,   color: 'text-red-600',    bg: 'bg-red-50' },
              { label: 'Net Revenue', value: summary?.net_revenue, icon: DollarSign,  color: 'text-primary-600',bg: 'bg-primary-50' },
              { label: 'Receivables', value: summary?.receivables, icon: Wallet,      color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="card flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${item.bg} ${item.color}`}><Icon size={22} /></div>
                  <div>
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className={`text-xl font-bold ${item.color}`}>{formatKES(item.value)}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card p-5 flex items-center gap-3">
            <div className={`p-3 rounded-xl ${ledgerCheck?.balanced ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              <Scale size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Ledger Integrity</p>
              <p className="font-semibold">
                {ledgerCheck?.balanced === undefined ? 'Checking…' :
                  ledgerCheck?.balanced ? 'Balanced — debits match credits' : 'IMBALANCE DETECTED'}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-400 text-center">Showing data for {summary?.month}</p>
        </div>
      )}

      {/* ── Wallets ───────────────────────────────────────────────── */}
      {tab === 'wallets' && (
        <div className="space-y-4">
          <div className="card p-5 flex flex-col sm:flex-row sm:items-end gap-4">
            <label className="block flex-1">
              <span className="text-sm text-gray-500 mb-1 block">Client ID</span>
              <input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter client ID"
                className={input}
              />
            </label>
            <button
              onClick={() => setModal('deposit')}
              disabled={!walletOn}
              className={`${btn} bg-green-600 hover:bg-green-700 disabled:opacity-40 flex items-center gap-2`}
            >
              <Plus size={16} /> Deposit
            </button>
            <button
              onClick={() => setModal('withdraw')}
              disabled={!walletOn}
              className={`${btn} bg-red-600 hover:bg-red-700 disabled:opacity-40`}
            >
              Withdraw
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <p className="text-sm text-gray-500">Current Balance</p>
              <p className="text-3xl font-bold text-primary-600 mt-1">{walletOn ? formatKES(balance?.balance) : '—'}</p>
            </div>
            <div className="card p-0 overflow-hidden">
              <div className="px-5 py-3 font-semibold text-sm border-b" style={{ borderColor: 'var(--pb-border)' }}>
                Recent Transactions
              </div>
              {walletOn ? (
                <Table
                  columns={[
                    { key: 'type', label: 'Type', render: (r) => <span className="capitalize">{r.type}</span> },
                    { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
                    { key: 'created_at', label: 'Date', render: (r) => formatDateTime(r.created_at) },
                  ]}
                  data={transactions}
                  loading={false}
                  emptyMessage="No transactions yet"
                />
              ) : (
                <p className="px-5 py-10 text-center text-sm text-gray-400">Enter a client ID to load wallet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Credit Notes ──────────────────────────────────────────── */}
      {tab === 'credit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setModal('credit')} className={`${btn} bg-blue-600 hover:bg-blue-700 flex items-center gap-2`}>
              <Plus size={16} /> Issue Credit Note
            </button>
          </div>
          <div className="card p-0 overflow-hidden">
            <Table
              columns={[
                { key: 'number', label: 'Number', render: (r) => r.credit_note_number },
                { key: 'client', label: 'Client', render: (r) => clientName(r) },
                { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
                { key: 'status', label: 'Status', render: (r) => <span className="capitalize">{r.status}</span> },
                { key: 'created_at', label: 'Date', render: (r) => formatDate(r.created_at) },
              ]}
              data={creditData?.data}
              loading={loadingCredit}
            />
            <Pagination meta={creditData?.meta} onPageChange={(p) => setPage(s => ({ ...s, credit: p }))} />
          </div>
        </div>
      )}

      {/* ── Debit Notes ───────────────────────────────────────────── */}
      {tab === 'debit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setModal('debit')} className={`${btn} bg-amber-600 hover:bg-amber-700 flex items-center gap-2`}>
              <Plus size={16} /> Issue Debit Note
            </button>
          </div>
          <div className="card p-0 overflow-hidden">
            <Table
              columns={[
                { key: 'number', label: 'Number', render: (r) => r.debit_note_number },
                { key: 'client', label: 'Client', render: (r) => clientName(r) },
                { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
                { key: 'status', label: 'Status', render: (r) => <span className="capitalize">{r.status}</span> },
                { key: 'created_at', label: 'Date', render: (r) => formatDate(r.created_at) },
              ]}
              data={debitData?.data}
              loading={loadingDebit}
            />
            <Pagination meta={debitData?.meta} onPageChange={(p) => setPage(s => ({ ...s, debit: p }))} />
          </div>
        </div>
      )}

      {/* ── Refunds ───────────────────────────────────────────────── */}
      {tab === 'refunds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setModal('refund')} className={`${btn} bg-red-600 hover:bg-red-700 flex items-center gap-2`}>
              <Plus size={16} /> Issue Refund
            </button>
          </div>
          <div className="card p-0 overflow-hidden">
            <Table
              columns={[
                { key: 'number', label: 'Number', render: (r) => r.refund_number },
                { key: 'client', label: 'Client', render: (r) => clientName(r) },
                { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{formatKES(r.amount)}</span> },
                { key: 'method', label: 'Method', render: (r) => <span className="capitalize">{r.method}</span> },
                { key: 'status', label: 'Status', render: (r) => <span className="capitalize">{r.status}</span> },
                { key: 'created_at', label: 'Date', render: (r) => formatDate(r.created_at) },
              ]}
              data={refundData?.data}
              loading={loadingRefund}
            />
            <Pagination meta={refundData?.meta} onPageChange={(p) => setPage(s => ({ ...s, refunds: p }))} />
          </div>
        </div>
      )}

      {/* ── Payment Plans ─────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setModal('plan')} className={`${btn} bg-purple-600 hover:bg-purple-700 flex items-center gap-2`}>
              <Plus size={16} /> Create Payment Plan
            </button>
          </div>
          <div className="card p-0 overflow-hidden">
            <Table
              columns={[
                { key: 'client', label: 'Client', render: (r) => clientName(r) },
                { key: 'total', label: 'Total', render: (r) => <span className="font-semibold">{formatKES(r.total_amount)}</span> },
                { key: 'paid', label: 'Paid', render: (r) => formatKES(r.paid_amount) },
                { key: 'remaining', label: 'Remaining', render: (r) => formatKES(r.total_amount - (r.paid_amount ?? 0)) },
                { key: 'installments', label: 'Installments', render: (r) => `${r.installment_count} × ${r.frequency ?? 'monthly'}` },
                { key: 'status', label: 'Status', render: (r) => <span className="capitalize">{r.status}</span> },
              ]}
              data={planData?.data}
              loading={loadingPlan}
            />
            <Pagination meta={planData?.meta} onPageChange={(p) => setPage(s => ({ ...s, plans: p }))} />
          </div>
        </div>
      )}

      {/* ── Trial Balance ─────────────────────────────────────────── */}
      {tab === 'statement' && (
        <div className="space-y-4">
          <div className="card p-0 overflow-hidden">
            {trialBalance === undefined ? <div className="py-16"><Spinner size="md" /></div> : (
              <Table
                columns={[
                  { key: 'account', label: 'Account', render: (r) => <span className="capitalize">{r.account_type.replace(/_/g, ' ')}</span> },
                  { key: 'debits', label: 'Debits', render: (r) => formatKES(r.total_debits) },
                  { key: 'credits', label: 'Credits', render: (r) => formatKES(r.total_credits) },
                  { key: 'balance', label: 'Balance', render: (r) => <span className="font-semibold">{formatKES(r.balance)}</span> },
                ]}
                data={trialBalance.accounts}
                loading={false}
              />
            )}
          </div>
          {trialBalance && (
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center"><p className="text-sm text-gray-500">Total Debits</p><p className="font-bold mt-1">{formatKES(trialBalance.total_debits)}</p></div>
              <div className="card p-4 text-center"><p className="text-sm text-gray-500">Total Credits</p><p className="font-bold mt-1">{formatKES(trialBalance.total_credits)}</p></div>
              <div className="card p-4 text-center">
                <p className="text-sm text-gray-500">Status</p>
                <p className={`font-bold mt-1 ${trialBalance.balanced ? 'text-green-600' : 'text-red-600'}`}>
                  {trialBalance.balanced ? 'Balanced' : 'Imbalanced'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────── */}
      <Modal isOpen={modal === 'deposit'} onClose={() => setModal(null)} title="Deposit to Wallet">
        <form onSubmit={(e) => submit(deposit.mutate, e)} className="space-y-3">
          {errorMsg(deposit) && <p className="text-sm text-red-600">{errorMsg(deposit)}</p>}
          <input type="hidden" name="client_id" value={clientId} />
          <label className="block"><span className="text-sm text-gray-500">Amount</span>
            <input name="amount" type="number" step="0.01" min="0.01" required className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Reference</span>
            <input name="reference" className={input} />
          </label>
          <button type="submit" disabled={deposit.isPending} className={`${btn} bg-green-600 hover:bg-green-700 w-full`}>
            {deposit.isPending ? 'Processing…' : 'Deposit'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'withdraw'} onClose={() => setModal(null)} title="Withdraw from Wallet">
        <form onSubmit={(e) => submit(withdraw.mutate, e)} className="space-y-3">
          {errorMsg(withdraw) && <p className="text-sm text-red-600">{errorMsg(withdraw)}</p>}
          <input type="hidden" name="client_id" value={clientId} />
          <label className="block"><span className="text-sm text-gray-500">Amount</span>
            <input name="amount" type="number" step="0.01" min="0.01" required className={input} />
          </label>
          <button type="submit" disabled={withdraw.isPending} className={`${btn} bg-red-600 hover:bg-red-700 w-full`}>
            {withdraw.isPending ? 'Processing…' : 'Withdraw'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'credit'} onClose={() => setModal(null)} title="Issue Credit Note">
        <form onSubmit={(e) => submit(mkCredit.mutate, e)} className="space-y-3">
          {errorMsg(mkCredit) && <p className="text-sm text-red-600">{errorMsg(mkCredit)}</p>}
          <label className="block"><span className="text-sm text-gray-500">Client ID</span>
            <input name="client_id" required className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Invoice ID (optional)</span>
            <input name="invoice_id" className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Amount</span>
            <input name="amount" type="number" step="0.01" min="0.01" required className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Reason</span>
            <input name="reason" className={input} />
          </label>
          <button type="submit" disabled={mkCredit.isPending} className={`${btn} bg-blue-600 hover:bg-blue-700 w-full`}>
            {mkCredit.isPending ? 'Processing…' : 'Issue'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'debit'} onClose={() => setModal(null)} title="Issue Debit Note">
        <form onSubmit={(e) => submit(mkDebit.mutate, e)} className="space-y-3">
          {errorMsg(mkDebit) && <p className="text-sm text-red-600">{errorMsg(mkDebit)}</p>}
          <label className="block"><span className="text-sm text-gray-500">Client ID</span>
            <input name="client_id" required className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Invoice ID (optional)</span>
            <input name="invoice_id" className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Amount</span>
            <input name="amount" type="number" step="0.01" min="0.01" required className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Reason</span>
            <input name="reason" className={input} />
          </label>
          <button type="submit" disabled={mkDebit.isPending} className={`${btn} bg-amber-600 hover:bg-amber-700 w-full`}>
            {mkDebit.isPending ? 'Processing…' : 'Issue'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'refund'} onClose={() => setModal(null)} title="Issue Refund">
        <form onSubmit={(e) => submit(refund.mutate, e)} className="space-y-3">
          {errorMsg(refund) && <p className="text-sm text-red-600">{errorMsg(refund)}</p>}
          <label className="block"><span className="text-sm text-gray-500">Client ID</span>
            <input name="client_id" required className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Payment ID</span>
            <input name="payment_id" required className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Amount</span>
            <input name="amount" type="number" step="0.01" min="0.01" required className={input} />
          </label>
          <label className="block"><span className="text-sm text-gray-500">Reason</span>
            <input name="reason" className={input} />
          </label>
          <button type="submit" disabled={refund.isPending} className={`${btn} bg-red-600 hover:bg-red-700 w-full`}>
            {refund.isPending ? 'Processing…' : 'Issue'}
          </button>
        </form>
      </Modal>

      <Modal isOpen={modal === 'plan'} onClose={() => setModal(null)} title="Create Payment Plan" size="lg">
        <form onSubmit={(e) => submit(plan.mutate, e)} className="space-y-3">
          {errorMsg(plan) && <p className="text-sm text-red-600">{errorMsg(plan)}</p>}
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-gray-500">Client ID</span>
              <input name="client_id" required className={input} />
            </label>
            <label className="block"><span className="text-sm text-gray-500">Invoice ID (optional)</span>
              <input name="invoice_id" className={input} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block"><span className="text-sm text-gray-500">Total Amount</span>
              <input name="total_amount" type="number" step="0.01" className={input} />
            </label>
            <label className="block"><span className="text-sm text-gray-500">Installment Count</span>
              <input name="installment_count" type="number" min="1" required className={input} />
            </label>
          </div>
          <label className="block"><span className="text-sm text-gray-500">Frequency</span>
            <select name="frequency" className={input}>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </label>
          <button type="submit" disabled={plan.isPending} className={`${btn} bg-purple-600 hover:bg-purple-700 w-full`}>
            {plan.isPending ? 'Processing…' : 'Create Plan'}
          </button>
        </form>
      </Modal>
    </div>
  )
}

