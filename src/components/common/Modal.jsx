export default function Badge({ label, className }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${className}`}>
      {label}
    </span>
  )
}