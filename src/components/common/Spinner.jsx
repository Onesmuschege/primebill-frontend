export default function Spinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-[3px]',
  }
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizes[size]} animate-spin rounded-full`}
        style={{
          borderColor: 'rgba(37,99,235,0.2)',
          borderTopColor: '#2563eb',
        }}
      />
    </div>
  )
}