export const formatKES = (amount) => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
  }).format(amount || 0)
}

export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-KE').format(num || 0)
}