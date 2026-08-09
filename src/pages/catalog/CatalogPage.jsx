import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { CATALOG_GROUPS, listCatalog, deleteCatalogItem } from '../../api/catalog.api'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import Modal from '../../components/common/Modal'
import Spinner from '../../components/common/Spinner'
import { Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'

const titleOf = (row = {}) =>
  row.name || row.title || row.event || row.code || row.type || `#${row.id}`

const FALLBACK_COLUMNS = ['name', 'code', 'type', 'status', 'severity', 'event', 'title', 'subject', 'category']

export default function CatalogPage() {
  const { hasPermission } = useAuth()
  const queryClient = useQueryClient()

  const [group, setGroup] = useState(CATALOG_GROUPS[0])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)

  const resource = group.resource
  const canManage = hasPermission(`manage ${group.prefix}`)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['catalog', group.prefix, resource, page, debouncedSearch],
    queryFn: () => listCatalog(group.prefix, resource, { page, search: debouncedSearch || undefined }),
    keepPreviousData: true,
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCatalogItem(group.prefix, resource, id),
    onSuccess: () => {
      toast.success('Item deleted')
      queryClient.invalidateQueries(['catalog', group.prefix, resource])
    },
    onError: () => toast.error('Delete failed'),
  })

  const onSearchChange = (value) => {
    setSearch(value)
    setPage(1)
    clearTimeout(onSearchChange._t)
    onSearchChange._t = setTimeout(() => setDebouncedSearch(value), 350)
  }

  const switchGroup = (g) => {
    setGroup(g)
    setSearch('')
return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Catalog / Reference Data</h2>
        <div className="flex flex-wrap gap-2">
          {CATALOG_GROUPS.map((g) => (
            <button
              key={g.prefix}
              onClick={() => switchGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                group.prefix === g.prefix
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search size={15} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Search ${group.label.toLowerCase()}...`}
            className="input text-sm pl-9"
          />
        </div>
        <p className="text-sm ml-auto" style={{ color: 'var(--pb-text-3)' }}>
          Browsing <strong>{group.label}</strong> &middot; {resource}
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading && (
          <div className="py-16"><Spinner size="lg" /></div>
        )}
        {isError && (
          <div className="px-6 py-16 text-center text-sm" style={{ color: '#dc2626' }}>
            <p className="font-medium">Failed to load {group.label.toLowerCase()}</p>
            <p className="mt-1 text-xs" style={{ color: 'var(--pb-text-3)' }}>
              {error?.response?.status === 403
                ? "You don't have permission to view this catalog."
                : 'Please check your connection and try again.'}
            </p>
          </div>
        )}
        {!isLoading && !isError && (
          <>
            <Table
              loading={false}
              data={data?.data || []}
              emptyMessage={`No ${group.label.toLowerCase()} found`}
              onRowClick={(row) => setDetail(row)}
              columns={[
                { key: 'id', label: 'ID' },
                {
                  key: 'title',
                  label: 'Name / Type',
                  render: (row) => <span className="font-medium">{titleOf(row)}</span>,
                },
                ...FALLBACK_COLUMNS
                  .filter((c) => (data?.data || []).some((r) => r[c] != null && c !== 'name' && c !== 'title'))
                  .slice(0, 2)
                  .map((c) => ({ key: c, label: c })),
                {
                  key: 'created_at',
                  label: 'Created',
                  render: (r) => (r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'),
                },
                {
                  key: 'actions',
                  label: '',
                  render: (row) => (
                    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDetail(row)}
                        className="p-1.5 rounded-lg hover:bg-gray-100"
                        title="View details"
                      >
                        <Pencil size={14} />
                      </button>
                      {canManage && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete ${titleOf(row)}? This cannot be undone.`)) {
                              deleteMutation.mutate(row.id)
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50"
                          style={{ color: '#dc2626' }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ),
                },
              ]}
            />
            <Pagination meta={data?.meta} onPageChange={setPage} />
          </>
        )}
      </div>

      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={`${group.label} · #${detail?.id ?? ''}`}>
        {detail && (
          <div className="space-y-1.5 text-sm">
            {Object.entries(detail).filter(([k]) => k !== 'tenant_id').map(([k, v]) => (
              <div key={k} className="flex gap-2 border-b border-gray-100 pb-1.5">
                <span className="w-32 shrink-0 font-medium" style={{ color: 'var(--pb-text-2)' }}>{k}</span>
                <span className="break-all">
                  {Array.isArray(v) || typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
                </span>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}
    setDebouncedSearch('')
    setPage(1)
    setDetail(null)
  }