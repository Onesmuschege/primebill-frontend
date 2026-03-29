import { useState } from 'react'
import { createClient } from '../../api/clients.api'
import toast from 'react-hot-toast'

export default function ClientForm({ onSuccess, initialData }) {
  const [form, setForm]   = useState(initialData || {
    first_name: '', last_name: '', phone: '',
    email: '', id_number: '', address: '',
    county: '', town: '', status: 'active',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createClient(form)
      onSuccess?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create client')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'first_name', label: 'First Name', required: true },
    { key: 'last_name',  label: 'Last Name',  required: true },
    { key: 'phone',      label: 'Phone',      required: true },
    { key: 'email',      label: 'Email' },
    { key: 'id_number',  label: 'ID Number' },
    { key: 'address',    label: 'Address' },
    { key: 'county',     label: 'County' },
    { key: 'town',       label: 'Town' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {fields.map(({ key, label, required }) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="input"
              required={required}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Save Client'}
        </button>
      </div>
    </form>
  )
}