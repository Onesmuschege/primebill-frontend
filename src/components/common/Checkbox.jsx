export default function Checkbox({ checked, onChange, label, id }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked || false}
        onChange={(e) => onChange?.(e.target.checked)}
        className="w-4 h-4 rounded border-2 appearance-none cursor-pointer transition-colors"
        style={{
          borderColor: checked ? '#818cf8' : 'var(--pb-border)',
          backgroundColor: checked ? '#818cf8' : 'transparent',
        }}
        id={id}
      />
      {label && <span className="text-sm" style={{ color: 'var(--pb-text-2)' }}>{label}</span>}
    </label>
  )
}
