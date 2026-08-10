import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExpenditures, createExpenditure, updateExpenditure, deleteExpenditure,
  getExpenditureCategories, getExpenditureSummary,
} from '../../api/expenditures.api'
import Table from '../../components/common/Table'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import Pagination from '../../components/common/Pagination'
import toast from 'react-hot-toast'
import { formatKES as money } from '../../utils/formatCurrency'

const EMPTY = { description: '', category: '', amount: '', date: new Date().toISOString().slice(0, 10) }

export default function ExpendituresPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const listQuery = useQuery({
    queryKey: ['expenditures', page, search],
    queryFn: async () => {
      const res = await getExpenditures({ page, per_page: 20 })
      const body = res.data?.data
      const data = body?.data ?? (Array.isArray(body) ? body : [])
      const meta = body?.meta ?? body ?? {}
      return { data, meta }
    },
  })
  const categories = useQuery({ queryKey: ['expenditure-categories'], queryFn: async () => (await getExpenditureCategories()).data.data })
  const summary = useQuery({ queryKey: ['expenditure-summary'], queryFn: async () => (await getExpenditureSummary()).data.data })

  const save = useMutation({
    mutationFn: (payload) => editing ? updateExpenditure(editing.id, payload) : createExpenditure(payload),
    onSuccess: () => { toast.success(editing ? 'Expenditure updated' : 'Expenditure recorded'); setModal(false); qc.invalidateQueries(['expenditures', 'expenditure-summary']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Save failed'),
  })
  const remove = useMutation({
    mutationFn: (id) => deleteExpenditure(id),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries(['expenditures', 'expenditure-summary']) },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  })

  const openNew = () => { setEditing(null); setForm(EMPTY); setModal(true) }
  const openEdit = (row) => { setEditing(row); setForm({ description: row.description || '', category: row.category || '', amount: row.amount ?? '', date: (row.date || '').slice(0, 10) || new Date().toISOString().slice(0, 10) }); setModal(true) }

  const catList = Array.isArray(categories.data) ? categories.data : []
  const total = Array.isArray(summary.data)
    ? summary.data.reduce((s, x) => s + (Number(x.sum || x.total || 0) || 0), 0)
    : (Number(summary.data?.total) || 0)

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Expenditures</h2>
          <p className="text-sm" style={{ color: 'var(--pb-text-3)' }}>Record and track operating costs</p>
        </div>
        <button onClick={openNew} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: '#2563eb' }}>+ Record Expenditure</button>
      </div>

      {summary.isLoading && <Spinner />}
      {!summary.isLoading && summary.data && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="text-2xl font-bold">{money(total)}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>Total Spent</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold">{catList.length}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>Categories</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold">{listQuery.data?.meta?.total ?? 0}</div>
            <div className="text-sm mt-1" style={{ color: 'var(--pb-text-3)' }}>Entries</div>
          </div>
        </div>
      )}

      <div className="card flex flex-wrap items-center gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search by description, category…" className="input text-sm" />
      </div>

      <div className="card p-0 overflow-hidden">
        <Table
          loading={listQuery.isLoading}
          data={listQuery.data?.data || []}
          emptyMessage="No expenditures found"
          onRowClick={(r) => openEdit(r)}
          columns={[
            { key: 'id', label: 'ID' },
            { key: 'date', label: 'Date', render: (r) => r.date ? new Date(r.date).toLocaleDateString() : '—' },
            { key: 'category', label: 'Category', render: (r) => r.category ? <span className="px-2 py-0.5 rounded-md text-xs" style={{ background: 'var(--pb-raised)' }}>{r.category}</span> : '—' },
            { key: 'description', label: 'Description' },
            { key: 'amount', label: 'Amount', render: (r) => <span className="font-semibold">{money(r.amount)}</span> },
            { key: 'actions', label: '', render: (r) => (
              <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-gray-100" title="Edit">✏️</button>
                <button onClick={() => { if (window.confirm('Delete this expenditure?')) remove.mutate(r.id) }} className="p-1.5 rounded-lg hover:bg-red-50" title="Delete" style={{ color: '#dc2626' }}>🗑️</button>
              </div>
            ) },
          ]}
        />
        <Pagination meta={listQuery.data?.meta} onPageChange={setPage} />
      </div>

      <Modal isOpen={!!modal} onClose={() => setModal(false)} title={editing ? 'Edit Expenditure' : 'Record Expenditure'} size="md">
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(form) }} className="space-y-4">
          {['description', 'category', 'amount', 'date'].map((k) => (
            <div key={k}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--pb-text-2)' }}>{k.charAt(0).toUpperCase() + k.slice(1)}</label>
              <input
                type={k === 'amount' ? 'number' : k === 'date' ? 'date' : 'text'}
                list={k === 'category' ? 'exp-categories' : undefined}
                value={form[k] ?? ''}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                placeholder={k === 'description' ? 'e.g. Fibre backbone maintenance' : undefined}
                className="input text-sm"
                required={k === 'description'}
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModal(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--pb-raised)' }}>Cancel</button>
            <button type="submit" disabled={save.isPending} className="px-4 py-2 rounded-lg text-sm text-white" style={{ background: '#2563eb' }}>{save.isPending ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}