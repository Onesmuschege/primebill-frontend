import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { Wifi, CheckCircle2, Loader2, Phone, ArrowRight, Clock, Zap, Shield } from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const API = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDuration(days) {
  if (!days || days === 0) return '—'
  if (days < 1) return `${Math.round(days * 24)} Hours`
  if (days === 1) return '1 Day'
  if (days === 2) return 'Weekend'
  if (days === 7) return '1 Week'
  return `${days} Days`
}

function formatSpeed(kbps) {
  if (!kbps) return '—'
  return kbps >= 1024 ? `${kbps / 1024} Mbps` : `${kbps} Kbps`
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('0')) return '254' + digits.slice(1)
  if (digits.startsWith('254')) return digits
  return '254' + digits
}

// ─── Plan card ───────────────────────────────────────────────────────────────

function PlanCard({ plan, selected, onSelect, primary, secondary }) {
  const isPopular = plan.validity_days === 1 && plan.price <= 180

  return (
    <button
      onClick={() => onSelect(plan)}
      className="relative w-full text-left rounded-2xl border-2 p-5 transition-all duration-200"
      style={{
        borderColor: selected ? primary : 'rgba(255,255,255,0.1)',
        background: selected
          ? `linear-gradient(135deg, ${primary}2e, ${secondary}14)`
          : 'rgba(255,255,255,0.04)',
        boxShadow: selected ? `0 0 0 1px ${primary}66, 0 4px 24px ${primary}26` : 'none',
      }}
    >
      {isPopular && (
        <span
          className="absolute -top-3 left-4 text-xs font-bold px-3 py-0.5 rounded-full"
          style={{ background: `linear-gradient(90deg,${primary},${secondary})`, color: '#fff' }}
        >
          POPULAR
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="font-bold text-white text-base leading-tight">{plan.name}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs" style={{ color: '#94a3b8' }}>
              <Clock size={11} />
              {formatDuration(plan.validity_days)}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: '#94a3b8' }}>
              <Zap size={11} />
              {formatSpeed(plan.speed_down)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-black" style={{
            background: `linear-gradient(90deg,${primary},${secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Ksh {Number(plan.price).toLocaleString()}
          </p>
        </div>
      </div>

      {selected && (
        <div className="absolute right-3 top-3">
          <CheckCircle2 size={18} style={{ color: secondary }} />
        </div>
      )}
    </button>
  )
}

// ─── States ───────────────────────────────────────────────────────────────────
// idle → selecting → paying → polling → success

export default function CaptivePortal() {
  const [searchParams] = useSearchParams()
  const { tenantSlug } = useParams()

  // MikroTik injects these into the redirect URL
  const username  = searchParams.get('username') || ''
  const mac       = searchParams.get('mac') || ''
  const linkOrig  = searchParams.get('link-orig') || 'http://google.com'

  const [plans, setPlans]           = useState([])
  const [theme, setTheme]           = useState(null)
  const [selected, setSelected]     = useState(null)
  const [phone, setPhone]           = useState('')
  const [stage, setStage]           = useState('selecting') // selecting | paying | polling | success
  const [pollCount, setPollCount]   = useState(0)
  const pollRef                     = useRef(null)

  // Load plans + branding on mount
  useEffect(() => {
    axios.get(`${API}/portal/${tenantSlug}/captive/plans`)
      .then(r => {
        setPlans(r.data.data || [])
        // Pre-select the daily plan as default
        const daily = r.data.data?.find(p => p.validity_days === 1 && p.price <= 180)
        if (daily) setSelected(daily)
      })
      .catch(() => toast.error('Failed to load plans. Please refresh.'))

    axios.get(`${API}/portal/${tenantSlug}/captive/theme`)
      .then(r => setTheme(r.data.data))
      .catch(() => {}) // silent — Screen falls back to default brand colors
  }, [tenantSlug])

  // Kick off status polling after STK push
  useEffect(() => {
    if (stage !== 'polling') return

    pollRef.current = setInterval(async () => {
      try {
        const r = await axios.get(`${API}/portal/${tenantSlug}/captive/status/${username}`)
        const { is_active } = r.data.data

        setPollCount(c => c + 1)

        if (is_active) {
          clearInterval(pollRef.current)
          setStage('success')
          // Give the success screen 3 seconds then bounce to original destination
          setTimeout(() => {
            window.location.href = linkOrig
          }, 3000)
        }
      } catch {
        // Silent — keep polling
      }
    }, 3000) // poll every 3 seconds

    return () => clearInterval(pollRef.current)
  }, [stage, username, linkOrig])

  const handlePay = async () => {
    if (!selected) return toast.error('Please select a plan')
    if (!phone)    return toast.error('Please enter your phone number')

    const formatted = formatPhone(phone)
    if (formatted.length !== 12) return toast.error('Enter a valid Safaricom number e.g. 07XX XXX XXX')

    setStage('paying')

    try {
      await axios.post(`${API}/portal/${tenantSlug}/captive/pay`, {
        phone:    formatted,
        plan_id:  selected.id,
        username: username,
      })

      toast.success('Check your phone — enter your M-Pesa PIN')
      setStage('polling')

    } catch (err) {
      const msg = err.response?.data?.message || 'Payment initiation failed. Try again.'
      toast.error(msg)
      setStage('selecting')
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <Screen>
        <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
            <CheckCircle2 size={40} style={{ color: '#34d399' }} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">You're connected!</h2>
            <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>
              {selected?.name} activated. Redirecting you now…
            </p>
          </div>
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#22d3ee', borderTopColor: 'transparent' }} />
        </div>
      </Screen>
    )
  }

  // ── Polling screen ──────────────────────────────────────────────────────────
  if (stage === 'polling') {
    return (
      <Screen>
        <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-16">
          <div className="w-20 h-20 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.12)', border: '2px solid rgba(37,99,235,0.3)' }}>
            <Phone size={34} style={{ color: '#60a5fa' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Waiting for payment…</h2>
            <p className="text-sm mt-2" style={{ color: '#94a3b8' }}>
              Enter your M-Pesa PIN on your phone to complete.
            </p>
            <p className="text-xs mt-3" style={{ color: '#475569' }}>
              Your internet will activate automatically once payment clears.
            </p>
          </div>
          <Loader2 size={28} className="animate-spin" style={{ color: '#22d3ee' }} />
          <button
            onClick={() => setStage('selecting')}
            className="text-xs underline mt-4"
            style={{ color: '#475569' }}
          >
            Cancel and go back
          </button>
        </div>
      </Screen>
    )
  }

  // ── Paying (brief transition) ───────────────────────────────────────────────
  if (stage === 'paying') {
    return (
      <Screen>
        <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
          <Loader2 size={36} className="animate-spin" style={{ color: '#22d3ee' }} />
          <p className="text-sm" style={{ color: '#94a3b8' }}>Sending payment request…</p>
        </div>
      </Screen>
    )
  }

  // ── Main plan-picker screen ─────────────────────────────────────────────────
  const primary   = theme?.primary_color   || '#2563eb'
  const secondary = theme?.secondary_color || '#06b6d4'
  const businessName = theme?.business_name || 'PrimeBill ISP'

  return (
    <Screen>
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1e293b', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.08)' },
      }} />

      {/* Header */}
      <div className="text-center mb-8">
        {theme?.logo_url ? (
          <img src={theme.logo_url} alt={businessName}
            className="w-14 h-14 rounded-2xl object-cover mx-auto mb-4"
            style={{ boxShadow: `0 0 32px ${primary}73` }} />
        ) : (
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: `linear-gradient(135deg,${primary},${secondary})`, boxShadow: `0 0 32px ${primary}73` }}>
            <Wifi size={26} className="text-white" />
          </div>
        )}
        <h1 className="text-2xl font-black text-white tracking-tight">{businessName}</h1>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          {theme?.welcome_message || 'Select a plan and pay via M-Pesa'}
        </p>
        {username && (
          <p className="text-xs mt-1.5 font-mono" style={{ color: '#475569' }}>
            Device: {username}
          </p>
        )}
      </div>

      {/* Plan list */}
      <div className="space-y-3 mb-6">
        {plans.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={24} className="animate-spin" style={{ color: '#475569' }} />
          </div>
        ) : (
          plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selected?.id === plan.id}
              onSelect={setSelected}
              primary={primary}
              secondary={secondary}
            />
          ))
        )}
      </div>

      {/* Phone input */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: '#64748b' }}>
          M-Pesa Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="07XX XXX XXX"
          className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          onFocus={e => e.target.style.borderColor = `${primary}99`}
          onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
        />
      </div>

      {/* Terms, if the ISP has set any */}
      {theme?.terms_text && (
        <p className="text-xs text-center mb-4" style={{ color: '#64748b' }}>
          {theme.terms_text}
        </p>
      )}

      {/* Pay button */}
      <button
        onClick={handlePay}
        disabled={!selected || !phone}
        className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: `linear-gradient(135deg,${primary},${secondary})`,
          boxShadow: selected && phone ? `0 0 32px ${primary}73` : 'none',
        }}
      >
        {selected
          ? `Pay Ksh ${Number(selected.price).toLocaleString()} via M-Pesa`
          : 'Select a plan to continue'}
        <ArrowRight size={16} />
      </button>

      {/* Footer trust badge */}
      <div className="flex flex-col items-center gap-1 mt-6">
        <div className="flex items-center justify-center gap-1.5">
          <Shield size={12} style={{ color: '#475569' }} />
          <p className="text-xs" style={{ color: '#475569' }}>
            Secured by {businessName}
          </p>
        </div>
        {theme?.support_phone && (
          <p className="text-xs" style={{ color: '#475569' }}>
            Need help? Call {theme.support_phone}
          </p>
        )}
      </div>
    </Screen>
  )
}

// ─── Shared screen wrapper ────────────────────────────────────────────────────
function Screen({ children }) {
  return (
    <div className="min-h-screen flex items-start justify-center"
      style={{ background: 'linear-gradient(135deg,#010510 0%,#0b1120 60%,#010510 100%)' }}>
      <div className="w-full max-w-md px-5 py-10">
        {children}
      </div>
    </div>
  )
}