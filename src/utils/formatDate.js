export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleDateString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Date(date).toLocaleString('en-KE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}