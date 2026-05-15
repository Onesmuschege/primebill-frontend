import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient, updateClient } from '../../api/clients.api'
import { getPlans } from '../../api/plans.api'
import toast from 'react-hot-toast'

// ✅ Field is outside ClientForm — prevents remount/focus-loss on every keystroke
function Field({ label, fieldKey, value, onChange, error, required, type = 'text', hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className={`input w-full ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        required={required}
      />
      {hint && !error && (
        <p className="text-xs text-gray-400 mt-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}
    </div>
  )
}

export default function ClientForm({ onSuccess, initialData }) {
  const [form, setForm] = useState(initialData || {
    first_name:   '',
    last_name:    '',
    phone:        '',
    email:        '',
    id_number:    '',
    address:      '',
    city:         '',
    county:       '',
    town:         '',
    account_type: '',
    plan_id:      '',
    status:       'active',
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const isEdit = !!initialData?.id

  const { data: plansData, isLoading: plansLoading } = useQuery({
    queryKey: ['plans-all'],
    queryFn: () => getPlans({ per_page: 100 }).then(r => r.data),
  })

  const plans = Array.isArray(plansData)
    ? plansData
    : Array.isArray(plansData?.data)
      ? plansData.data
      : []

  // ✅ Renamed from `set` to `handleChange` and accepts key+value
  const handleChange = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const handleError = (err) => {
    const data = err.response?.data
    if (data?.errors) {
      const mapped = {}
      Object.entries(data.errors).forEach(([k, v]) => {
        mapped[k] = Array.isArray(v) ? v[0] : v
      })
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

      {/* Name row */}
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="first_name" label="First Name" required
          value={form.first_name} onChange={handleChange} error={errors.first_name} />
        <Field fieldKey="last_name" label="Last Name" required
          value={form.last_name} onChange={handleChange} error={errors.last_name} />
      </div>

      {/* Contact row */}
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="phone" label="Phone" required
          value={form.phone} onChange={handleChange} error={errors.phone}
          hint="Format: 0712345678 or 254712345678" />
        <Field fieldKey="email" label="Email" type="email" required
          value={form.email} onChange={handleChange} error={errors.email} />
      </div>

      {/* ID + Address */}
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="id_number" label="ID Number" required
          value={form.id_number} onChange={handleChange} error={errors.id_number}
          hint="National ID, 1–8 digits" />
        <Field fieldKey="address" label="Address" required
          value={form.address} onChange={handleChange} error={errors.address} />
      </div>

      {/* Location */}
      <div className="grid grid-cols-3 gap-4">
        <Field fieldKey="city" label="City" required
          value={form.city} onChange={handleChange} error={errors.city} />
        <Field fieldKey="county" label="County"
          value={form.county} onChange={handleChange} error={errors.county} />
        <Field fieldKey="town" label="Town"
          value={form.town} onChange={handleChange} error={errors.town} />
      </div>

      {/* Account type + Plan */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Account Type <span className="text-red-500">*</span>
          </label>
          <select
            value={form.account_type}
            onChange={(e) => handleChange('account_type', e.target.value)}
            className={`input w-full ${errors.account_type ? 'border-red-500' : ''}`}
            required
          >
            <option value="">Select type...</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="corporate">Corporate</option>
          </select>
          {errors.account_type && (
            <p className="text-xs text-red-500 mt-1">{errors.account_type}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan <span className="text-red-500">*</span>
          </label>
          <select
            value={form.plan_id}
            onChange={(e) => handleChange('plan_id', e.target.value)}
            className={`input w-full ${errors.plan_id ? 'border-red-500' : ''}`}
            required
            disabled={plansLoading}
          >
            <option value="">
              {plansLoading ? 'Loading plans...' : 'Select plan...'}
            </option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — KES {Number(plan.price).toLocaleString()}/mo
              </option>
            ))}
          </select>
          {errors.plan_id && (
            <p className="text-xs text-red-500 mt-1">{errors.plan_id}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button
          type="submit"
          disabled={loading || plansLoading}
          className="btn-primary min-w-[120px]"
        >
          {loading ? 'Saving...' : isEdit ? 'Update Client' : 'Save Client'}
        </button>
      </div>

    </form>
  )
}