import { ChevronUp, ChevronDown } from 'lucide-react'
import Spinner from './Spinner'

export default function Table({
  columns = [],
  data = [],
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  sort,
  onSort,
}) {
  if (loading) {
    return (
      <div className="py-16">
        <Spinner size="md" />
      </div>
    )
  }

  const safeData = Array.isArray(data) ? data : []

  const handleSort = (col) => {
    if (!onSort || !col.sortable) return
    const direction = sort?.key === col.key && sort.direction === 'asc' ? 'desc' : 'asc'
    onSort({ key: col.key, direction })
  }

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col)}
                style={{
                  cursor: col.sortable && onSort ? 'pointer' : 'default',
                  userSelect: 'none',
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && onSort && sort?.key === col.key && (
                    sort.direction === 'asc'
                      ? <ChevronUp size={12} />
                      : <ChevronDown size={12} />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {safeData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-sm"
                style={{ color: 'var(--pb-text-3)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            safeData.map((row, i) => (
              <tr
                key={row.id ?? i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}