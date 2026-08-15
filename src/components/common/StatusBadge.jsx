/**
 * StatusBadge component
 * Usage: <StatusBadge status="available" />
 * Maps technician/location status values to colour-coded badges.
 */

const STATUS_VARIANTS = {
  available:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  busy:       'bg-amber-50  text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
  on_break:   'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  offline:    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700',
};

export default function StatusBadge({ status }) {
  const variant = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.offline;
  const label = status?.replace('_', ' ') ?? 'offline';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variant}`}>
      {label}
    </span>
  );
}
