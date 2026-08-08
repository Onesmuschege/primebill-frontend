import { useState } from 'react'
import { createProspect, updateProspect } from '../../api/leads.api'
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

export default function ProspectForm({ onSuccess, initialData }) {
  const [form, setForm] = useState(initialData || {
    first_name: '', last_name: '', phone: '', email: '',
    alt_phone: '', address: '', town: '', county: '',
    interested_package: '', installation_type: 'fiber',
    installation_fee_quoted: '', pipeline_stage: 'new',
    notes: '',
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
      toast.error(data?.message || 'Failed to save prospect')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      if (isEdit) {
        await updateProspect(initialData.id, form)
        toast.success('Prospect updated successfully!')
      } else {
        await createProspect(form)
        toast.success('Prospect created successfully!')
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
        <Field fieldKey="alt_phone" label="Alt Phone" value={form.alt_phone} onChange={handleChange} error={errors.alt_phone} />
        <Field fieldKey="interested_package" label="Interested Package" value={form.interested_package} onChange={handleChange} error={errors.interested_package} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="address" label="Address" value={form.address} onChange={handleChange} error={errors.address} />
        <Field fieldKey="town"    label="Town"    value={form.town}    onChange={handleChange} error={errors.town} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="county" label="County" value={form.county} onChange={handleChange} error={errors.county} />

        {/* Installation Type */}
        <div>
          <label className="label">Installation Type</label>
          <select
            value={form.installation_type}
            onChange={(e) => handleChange('installation_type', e.target.value)}
            className="input w-full"
          >
            <option value="fiber">Fiber</option>
            <option value="wireless">Wireless</option>
            <option value="pppoe">PPPoE</option>
          </select>
          {errors.installation_type && <p className="text-xs mt-1 text-red-400">{errors.installation_type}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field fieldKey="installation_fee_quoted" label="Installation Fee (KES)" type="number" value={form.installation_fee_quoted} onChange={handleChange} error={errors.installation_fee_quoted} />

        {/* Pipeline Stage */}
        <div>
          <label className="label">Pipeline Stage</label>
          <select
            value={form.pipeline_stage}
            onChange={(e) => handleChange('pipeline_stage', e.target.value)}
            className="input w-full"
          >
            <option value="new">New</option>
            <option value="negotiation">Negotiation</option>
            <option value="survey_scheduled">Survey Scheduled</option>
            <option value="survey_completed">Survey Completed</option>
            <option value="installation_scheduled">Installation Scheduled</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          {errors.pipeline_stage && <p className="text-xs mt-1 text-red-400">{errors.pipeline_stage}</p>}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          className="input w-full min-h-[80px]"
          placeholder="Additional notes about this prospect..."
        />
        {errors.notes && <p className="text-xs mt-1 text-red-400">{errors.notes}</p>}
      </div>

      <div className="flex justify-end pt-2" style={{ borderTop: '1px solid var(--pb-border)' }}>
        <button type="submit" disabled={loading} className="btn-primary min-w-[120px]">
          {loading ? 'Saving...' : isEdit ? 'Update Prospect' : 'Save Prospect'}
        </button>
      </div>
    </form>
  )
}