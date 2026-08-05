import { useState } from 'react'
import { createClient, updateClient } from '../../api/clients.api'
import toast from 'react-hot-toast'

function Field({ label, fieldKey, value, onChange, error, required, type = 'text', hint }) {
  return (
    <div>
      <label className="label">
        {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className={`input ${error ? 'border-red-500 focus:ring-red-500/30' : ''}`}
        required={required}
      />
      {hint && !error && <p className="text-xs mt-1" style={{ color: 'var(--pb-text-3)' }}>{hint}</p>}
      {error && <p className="text-xs mt-1 text-red-400">{error}</p>}
    </div>
  )
}

export default function ClientForm({ onSuccess, initialData }) {
  const [form, setForm] = useState(initialData || {
    first_name: '', last_name: '', phone: '', email: '',
    id_number: '', address: '', county: '', town: '',
    status: 'active',
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const isEdit = !!initialData?.id

  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const handleError = (err) => {
    const data = err.response?.data
    if (data?.errors) {
      const mapped = {}
      Object.entries(data.errors).forEach(([k, v]) => { mapped[k] = Array.isArray(v) ? v[0] : v })
      setErrors(mapped)
      toast.error('Please fix the highlighted fields.')
    } else {
      toast.error(data?.message || 'Failed to save client')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      if (isEdit) {
        await updateClient(initialData.id, form)
        toast.success('Client updated successfully!')
      } else {
        await createClient(form)
        toast.success('Client created successfully!')
      }
      onSuccess?.()
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="first_name" label="First Name" required value={form.first_name} onChange={handleChange} error={errors.first_name} />
        <Field fieldKey="last_name"  label="Last Name"  required value={form.last_name}  onChange={handleChange} error={errors.last_name} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="phone" label="Phone" required value={form.phone} onChange={handleChange} error={errors.phone} hint="Format: 0712345678" />
        <Field fieldKey="email" label="Email" type="email" value={form.email} onChange={handleChange} error={errors.email} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="id_number" label="ID Number" value={form.id_number} onChange={handleChange} error={errors.id_number} hint="National ID" />
        <Field fieldKey="address"   label="Address"   value={form.address}   onChange={handleChange} error={errors.address} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="county" label="County" value={form.county} onChange={handleChange} error={errors.county} />
        <Field fieldKey="town"   label="Town"   value={form.town}   onChange={handleChange} error={errors.town} />
      </div>

      {/* Status */}
      <div>
        <label className="label">Status</label>
        <select
          value={form.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="input w-full"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
          <option value="disabled">Disabled</option>
        </select>
        {errors.status && <p className="text-xs mt-1 text-red-400">{errors.status}</p>}
      </div>

      <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
        <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
          {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Save Client'}
        </button>
      </div>
    </form>
  )
}
