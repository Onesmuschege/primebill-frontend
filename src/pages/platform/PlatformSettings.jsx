import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getPlatformSettings, updatePlatformSettings } from '../../api/platform.api'
import Spinner from '../../components/common/Spinner'
import { Save, RotateCcw, ShieldCheck, ReceiptText, Settings2 } from 'lucide-react'

const GROUP_ICONS = { security: ShieldCheck, billing: ReceiptText }

// Flatten grouped settings into a single key → value form map so inputs can
// update without nested state surgery.
const toDraft = (groups) =>
  Object.values(groups).reduce((acc, keys) => {
    Object.values(keys).forEach((meta) => { acc[meta.key] = meta.value })
    return acc
  }, {})

export default function PlatformSettings() {
  const qc = useQueryClient()
  // Local edits only: overrides[key] holds a value that differs from what the
  // server last reported. Removing the key reverts to the persisted value, so
  // nothing is destroyed just by typing (with the schema default as fallback).
  const [overrides, setOverrides] = useState({})

  const { data, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => getPlatformSettings(),
  })

  const groups = data?.groups || {}
  const settings = data?.settings || {}

  // key → schema meta lookup, used for defaults + range/type hints.
  const metaByKey = {}
  Object.values(settings).forEach((keys) => Object.values(keys).forEach((m) => { metaByKey[m.key] = m }))

  // persisted[key] is the last value the server reported for key.
  const persisted = toDraft(settings)

  const valueFor = (key) => overrides[key] ?? persisted[key] ?? metaByKey[key]?.default
  const baselineFor = (key) => persisted[key] ?? metaByKey[key]?.default
  const isDefault = (key) => String(valueFor(key)) === String(metaByKey[key]?.default)

  const setValue = (key, value) => {
    setOverrides((o) => {
      const next = { ...o }
      if (String(value) === String(baselineFor(key))) {
        delete next[key]
      } else {
        next[key] = value
      }
      return next
    })
  }

  const saveMut = useMutation({
    mutationFn: (keys) => updatePlatformSettings(Object.fromEntries(keys.map((k) => [k, valueFor(k)]))),
    onSuccess: () => {
      toast.success('Platform settings saved')
      setOverrides({})
      qc.invalidateQueries({ queryKey: ['platform-settings'] })
    },
    onError: (e) => toast.error(e?.response?.data?.message || 'Failed to save settings'),
  })

  const changedKeys = Object.keys(overrides)
  const busy = saveMut.isPending

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--pb-text-1)' }}>Platform Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--pb-text-2)' }}>
            Operator-level preferences for PrimeBill itself. Every value here drives real behavior —
            security suspicion thresholds and platform invoice numbering/payment terms.
          </p>
        </div>
        <button
          onClick={() => saveMut.mutate(changedKeys)}
          disabled={busy || changedKeys.length === 0}
          className="btn-primary text-sm py-2 px-4 flex items-center gap-2 whitespace-nowrap"
        >
          <Save size={16} />
          {busy ? 'Saving…' : changedKeys.length > 0 ? `Save ${changedKeys.length} change${changedKeys.length === 1 ? '' : 's'}` : 'Saved'}
        </button>
      </div>

      {Object.keys(groups).map((groupKey) => {
        const GroupIcon = GROUP_ICONS[groupKey] || Settings2
        const keys = settings[groupKey] || {}
        return (
          <div key={groupKey} className="card">
            <div className="flex items-center gap-2 pb-3" style={{ borderBottom: '1px solid var(--pb-border)' }}>
              <GroupIcon size={18} style={{ color: 'var(--pb-accent)' }} />
              <h3 className="font-semibold" style={{ color: 'var(--pb-text-1)' }}>{groups[groupKey]}</h3>
            </div>

            {Object.values(keys).map((meta) => {
              const value = valueFor(meta.key)
              const dirty = !isDefault(meta.key)
              return (
                <div key={meta.key} className="py-3" style={{ borderBottom: '1px solid var(--pb-border)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <label className="text-sm font-medium block" style={{ color: 'var(--pb-text-1)' }}>{meta.label}</label>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--pb-text-3)' }}>{meta.description}</p>
                    </div>
                    {dirty && (
                      <button
                        type="button"
                        onClick={() => setValue(meta.key, meta.default)}
                        title={`Reset to default (${meta.default})`}
                        className="text-xs px-2 py-1 rounded-full flex items-center gap-1 shrink-0"
                        style={{ color: 'var(--pb-accent)', background: 'rgba(59,130,246,0.1)' }}
                      >
                        <RotateCcw size={12} /> Reset
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <input
                      type={meta.type === 'int' ? 'number' : 'text'}
                      min={meta.type === 'int' ? meta.min : undefined}
                      max={meta.type === 'int' ? meta.max : undefined}
                      maxLength={meta.type === 'string' ? meta.max : undefined}
                      value={value ?? ''}
                      onChange={(e) => setValue(meta.key, e.target.value)}
                      className="input w-full md:w-72 text-sm"
                    />
                    {dirty && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.12)' }}>
                        Changed
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      })}
      <p className="text-xs" style={{ color: 'var(--pb-text-3)' }}>
        Settings persist in the <code>platform_settings</code> table and are consumed immediately: the
        Security Center suspicion scanner reads the failed-login threshold and window on every request,
        and generated platform invoices are numbered with the invoice prefix and due{' '}
        <code>payment_terms_days</code> after issue. Values are cast by type and range-validated
        server-side; unknown keys are rejected.
      </p>
    </div>
  )
}