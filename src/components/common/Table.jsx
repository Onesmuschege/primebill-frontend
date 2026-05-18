import Spinner from './Spinner'

export default function Table({
  columns = [],
  data = [],
  loading,
  emptyMessage = 'No data found',
  onRowClick,
}) {
  if (loading) {
    return (
      <div className="py-16">
        <Spinner size="md" />
      </div>
    )
  }

  const safeData = Array.isArray(data) ? data : []

  return (
    <div className="overflow-x-auto">
      <table className="table w-full">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
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