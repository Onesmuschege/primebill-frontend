import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, ArrowRight, Wifi, Zap, Globe, Server, Shield, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import BRAND from '../../config/brand'

const STATS = [
  { icon: Globe,  label: 'Uptime',    value: '99.9%' },
  { icon: Zap,    label: 'Avg Speed', value: '1 Gbps' },
  { icon: Server, label: 'Nodes',     value: '240+'   },
  { icon: Wifi,   label: 'Clients',   value: '12k+'   },
]

const FEATURES = [
  'Real-time network monitoring',
  'Automated billing & invoicing',
  'M-Pesa & card payment integration',
]

// ─── Deep Space Canvas — FIXED, covers the entire viewport ───────────────────
function DeepSpaceCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const makeStars = (count, speed, minR, maxR, alpha) =>
      Array.from({ length: count }, () => ({
        x: Math.random(), y: Math.random(),
        r: minR + Math.random() * (maxR - minR),
        speed,
        alpha: alpha * (0.4 + Math.random() * 0.6),
        twinkleOffset: Math.random() * Math.PI * 2,
        twinkleSpeed:  0.3 + Math.random() * 1.1,
        cold: Math.random() > 0.65,
      }))

    const layers = [
      makeStars(300, 0.008, 0.3, 0.8,  0.38),
      makeStars(130, 0.018, 0.6, 1.3,  0.62),
      makeStars(55,  0.036, 1.1, 2.4,  0.90),
    ]

    const NEBULAE = [
      { cx:0.18, cy:0.22, rx:0.55, ry:0.45, color:'63,94,251',  alpha:0.13, speed:0.007 },
      { cx:0.78, cy:0.70, rx:0.50, ry:0.42, color:'6,182,212',  alpha:0.10, speed:0.005 },
      { cx:0.50, cy:0.06, rx:0.65, ry:0.32, color:'99,60,220',  alpha:0.08, speed:0.004 },
      { cx:0.08, cy:0.88, rx:0.40, ry:0.34, color:'30,64,175',  alpha:0.09, speed:0.006 },
      { cx:0.90, cy:0.38, rx:0.42, ry:0.36, color:'14,116,144', alpha:0.07, speed:0.008 },
      { cx:0.55, cy:0.52, rx:0.38, ry:0.30, color:'79,70,229',  alpha:0.06, speed:0.003 },
    ]
    const nebulaPhase = NEBULAE.map(() => Math.random() * Math.PI * 2)

    const shooters = []
    const spawnShooter = () => shooters.push({
      x: Math.random() * 0.85 + 0.05, y: Math.random() * 0.4,
      len: 0.06 + Math.random() * 0.09, speed: 0.002 + Math.random() * 0.003,
      alpha: 0, phase: 'in',
      angle: Math.PI / 5 + Math.random() * Math.PI / 8,
    })
    let shooterTimer = 0

    function draw(ts) {
      const W = canvas.width, H = canvas.height

      ctx.fillStyle = '#010510'
      ctx.fillRect(0, 0, W, H)

      const centre = ctx.createRadialGradient(W*0.5, H*0.5, 0, W*0.5, H*0.5, W*0.7)
      centre.addColorStop(0, 'rgba(3,9,28,0)')
      centre.addColorStop(1, 'rgba(0,2,10,0.5)')
      ctx.fillStyle = centre; ctx.fillRect(0, 0, W, H)

      NEBULAE.forEach((neb, i) => {
        nebulaPhase[i] += neb.speed * 0.016
        const drift = Math.sin(nebulaPhase[i]) * 0.022
        const cx = (neb.cx + drift) * W
        const cy = (neb.cy + Math.cos(nebulaPhase[i] * 0.7) * 0.016) * H
        const rx = neb.rx * W, ry = neb.ry * H
        ctx.save()
        ctx.globalAlpha = neb.alpha
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
        g.addColorStop(0,   `rgba(${neb.color},1)`)
        g.addColorStop(0.4, `rgba(${neb.color},0.35)`)
        g.addColorStop(1,   `rgba(${neb.color},0)`)
        ctx.scale(1, ry / rx)
        ctx.beginPath(); ctx.arc(cx, cy * (rx / ry), rx, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
        ctx.restore()
      })

      layers.forEach(layer => {
        layer.forEach(s => {
          s.x -= s.speed * 0.00042
          if (s.x < 0) { s.x = 1; s.y = Math.random() }
          const sx = s.x * W, sy = s.y * H
          const twinkle = (Math.sin(ts * 0.001 * s.twinkleSpeed + s.twinkleOffset) + 1) / 2
          const a = s.alpha * (0.45 + 0.55 * twinkle)
          ctx.save()
          if (s.r > 1.4) {
            const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, s.r * 5.5)
            glow.addColorStop(0, s.cold ? `rgba(180,215,255,${a*0.45})` : `rgba(140,175,255,${a*0.28})`)
            glow.addColorStop(1, 'rgba(0,0,0,0)')
            ctx.beginPath(); ctx.arc(sx, sy, s.r * 5.5, 0, Math.PI * 2)
            ctx.fillStyle = glow; ctx.fill()
          }
          ctx.globalAlpha = a
          ctx.beginPath(); ctx.arc(sx, sy, s.r, 0, Math.PI * 2)
          ctx.fillStyle = s.cold ? '#cce0ff' : '#e8f0ff'
          ctx.fill(); ctx.restore()
        })
      })

      shooterTimer += 16
      if (shooterTimer > 3200 + Math.random() * 5000) { spawnShooter(); shooterTimer = 0 }
      for (let i = shooters.length - 1; i >= 0; i--) {
        const s = shooters[i]
        const dx = Math.cos(s.angle) * s.len * W
        const dy = Math.sin(s.angle) * s.len * H
        const ex = s.x * W + dx, ey = s.y * H + dy
        if (s.phase === 'in') { s.alpha += 0.055; if (s.alpha >= 1) s.phase = 'out' }
        else s.alpha -= 0.028
        if (s.alpha <= 0) { shooters.splice(i, 1); continue }
        s.x += Math.cos(s.angle) * s.speed
        s.y += Math.sin(s.angle) * s.speed
        ctx.save()
        const trail = ctx.createLinearGradient(s.x*W, s.y*H, ex, ey)
        trail.addColorStop(0, `rgba(255,255,255,${s.alpha*0.95})`)
        trail.addColorStop(1, 'rgba(100,160,255,0)')
        ctx.strokeStyle = trail; ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.moveTo(s.x*W, s.y*H); ctx.lineTo(ex, ey)
        ctx.stroke(); ctx.restore()
      }

      const vig = ctx.createRadialGradient(W*0.5, H*0.5, H*0.12, W*0.5, H*0.5, H*0.92)
      vig.addColorStop(0, 'rgba(0,0,0,0)')
      vig.addColorStop(1, 'rgba(0,0,14,0.72)')
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)
    }

    const loop = (ts) => { draw(ts); animId = requestAnimationFrame(loop) }
    animId = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 0 }}
      aria-hidden="true"
    />
  )
}

// ─── Login page ───────────────────────────────────────────────────────────────
export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '', remember: false })
  const [showPass, setShowPass] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [mfaStep, setMfaStep]   = useState(null) // { mfaToken, mfaUser }
  const [mfaCode, setMfaCode]   = useState('')
  const [mfaError, setMfaError] = useState(false)
  const { login, completeMfaChallenge, loading } = useAuth()
  const navigate                = useNavigate()

  // FIX 1: force dark mode on this route regardless of stored theme preference,
  // without touching the user's saved pb-theme. This is what was causing the
  // white input fields — .input reads --pb-raised / --pb-text-1 which resolve
  // to light-mode values unless `.dark` is present on <html>.
  useEffect(() => {
    const root = document.documentElement
    const hadDark = root.classList.contains('dark')
    root.classList.add('dark')
    return () => { if (!hadDark) root.classList.remove('dark') }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setHasError(false)
    const result = await login({ email: form.email, password: form.password })
    // MFA-protected account — present the TOTP/backup-code step instead of
    // granting a session. The backend never issued a token yet.
    if (result.success && result.mfaRequired) {
      setMfaStep({ mfaToken: result.mfaToken, mfaUser: result.mfaUser })
      return
    }
    if (result.success) {
      toast.success('Welcome back!')
      // Platform admins land on the Platform Console; tenant users land on
      // their tenant dashboard. Same /login flow, different destination.
      navigate(result.user?.is_platform_admin ? '/platform' : '/dashboard')
    } else {
      setHasError(true)
      toast.error(result.message)
    }
  }

  const handleMfaSubmit = async (e) => {
    e.preventDefault()
    setMfaError(false)
    if (!mfaStep) return
    const result = await completeMfaChallenge(mfaStep.mfaToken, mfaCode)
    if (result.success) {
      toast.success('Welcome back!')
      navigate(result.user?.is_platform_admin ? '/platform' : '/dashboard')
    } else {
      setMfaError(true)
      toast.error(result.message)
    }
  }

  // clear the error state as soon as the person starts correcting input
  const updateField = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
    if (hasError) setHasError(false)
  }

  return (
    <>
      <DeepSpaceCanvas />

      <div
        className="min-h-screen flex overflow-hidden"
        style={{
          position: 'relative',
          zIndex: 1,
          fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* ══════════════════════════════════════════════════
            LEFT PANEL
        ══════════════════════════════════════════════════ */}
        <div className="hidden lg:flex flex-col" style={{ width: '55%', minHeight: '100vh' }}>
          <div className="flex flex-col h-full px-12 py-10" style={{ minHeight: '100vh' }}>

            <div className="flex items-center gap-3 shrink-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                  boxShadow: '0 0 24px rgba(37,99,235,0.55)',
                }}
              >
                <Wifi size={18} className="text-white" />
              </div>
              <div>
                <span className="text-white font-bold text-lg leading-none tracking-tight block"
                  style={{ fontFamily: "'DM Mono', monospace" }}>{BRAND.display}</span>
                <span className="text-xs" style={{ color: '#75a7f1' }}>by DarkOpsHub</span>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center gap-8 max-w-sm">

              <div className="flex items-center gap-2 w-fit px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.2)',
                  color: '#34d399',
                }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl font-bold text-white leading-tight tracking-tight"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  Manage your<br />
                  <span style={{
                    background: 'linear-gradient(90deg, #60a5fa 0%, #22d3ee 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>ISP network</span><br />
                  with precision.
                </h1>
                <p className="text-sm leading-relaxed" style={{ color: '#7a96b8' }}>
                  Real-time billing, client management and network monitoring built for African ISPs.
                </p>
              </div>

              <ul className="space-y-2.5">
                {FEATURES.map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm" style={{ color: '#94a3b8' }}>
                    <CheckCircle2 size={15} style={{ color: '#22d3ee', flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-2 gap-2.5">
                {STATS.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                    style={{
                      background: 'rgba(5,10,30,0.55)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(12px)',
                    }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(37,99,235,0.2)' }}>
                      <Icon size={13} style={{ color: '#60a5fa' }} />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-none">{value}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#5b9be9' }}>{label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="shrink-0 text-xs" style={{ color: '#7a96b8'}}>
              © 2026 DarkOpsHub · {BRAND.display}
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT PANEL
        ══════════════════════════════════════════════════ */}
        <div
          className="flex flex-col items-center justify-center flex-1 lg:flex-none px-8 py-10 relative"
          style={{ width: '45%', minHeight: '100vh' }}
        >
          <div className="hidden lg:block absolute left-0 inset-y-0 w-px"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(37,99,235,0.25) 30%, rgba(6,182,212,0.2) 70%, transparent)' }} />

          <div className="lg:hidden absolute top-6 left-8 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
              <Wifi size={15} className="text-white" />
            </div>
            <span className="text-white font-bold text-base" style={{ fontFamily: "'DM Mono', monospace" }}>
              {BRAND.brand}
            </span>
          </div>

          {/* FIX 3: animated conic-gradient border ring wraps the card */}
          <div className="relative w-full max-w-[380px]">
            <div
              className="absolute -inset-px rounded-2xl pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, transparent 0%, rgba(37,99,235,0.55) 12%, transparent 26%)',
                animation: 'pb-border-spin 7s linear infinite',
                opacity: 0.8,
              }}
            />

            <div
              className="relative w-full rounded-2xl p-8"
              style={{
                background: 'rgba(4, 8, 24, 0.88)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                boxShadow: '0 8px 48px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              <div className="mb-7">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(37,99,235,0.28)' }}>
                    <Shield size={15} style={{ color: '#60a5fa' }} />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#3b82f6' }}>
                    Secure Access
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "'DM Mono', monospace" }}>
                  Welcome back
                </h2>
                <p className="text-sm mt-1.5" style={{ color: '#64748b' }}>
                  Sign in to your admin dashboard
                </p>
              </div>

              <form onSubmit={mfaStep ? handleMfaSubmit : handleSubmit} className={`space-y-4 ${hasError ? 'pb-shake' : ''}`}>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                    style={{ color: '#64748b' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={updateField('email')}
                    className="input"
                    placeholder="admin@primebill.co.ke"
                    autoComplete="email"
                    required
                    aria-invalid={hasError}
                    style={hasError ? {
                      borderColor: 'rgba(239,68,68,0.6)',
                      boxShadow: '0 0 0 3px rgba(239,68,68,0.12)',
                    } : undefined}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#64748b' }}>
                      Password
                    </label>
                    <Link to="/forgot-password"
                      className="text-xs transition-colors hover:text-blue-300"
                      style={{ color: '#3b82f6' }}>
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={form.password}
                      onChange={updateField('password')}
                      className="input pr-10"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                      aria-invalid={hasError}
                      style={hasError ? {
                        borderColor: 'rgba(239,68,68,0.6)',
                        boxShadow: '0 0 0 3px rgba(239,68,68,0.12)',
                      } : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-slate-300"
                      style={{ color: '#4b6080' }}
                      aria-label={showPass ? 'Hide password' : 'Show password'}
                    >
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {hasError && (
                    <p className="text-xs mt-1.5" style={{ color: '#f87171' }}>
                      Incorrect email or password. Try again.
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-3 cursor-pointer pt-0.5">
                  <div className="relative shrink-0">
                    <input
                      type="checkbox"
                      checked={form.remember}
                      onChange={e => setForm({ ...form, remember: e.target.checked })}
                      className="sr-only"
                    />
                    <div className="w-4 h-4 rounded-[4px] border transition-all flex items-center justify-center"
                      style={{
                        borderColor: form.remember ? '#2563eb' : '#1e293b',
                        backgroundColor: form.remember ? '#2563eb' : 'transparent',
                      }}>
                      {form.remember && (
                        <svg viewBox="0 0 10 8" className="w-2.5 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 4l2.5 2.5L9 1" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm select-none" style={{ color: '#64748b' }}>
                    Remember me for 30 days
                  </span>
                </label>

                {mfaStep && (
                  <div className="rounded-lg p-4 space-y-3"
                    style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.18)' }}>
                    <div className="flex items-center gap-2">
                      <Shield size={16} style={{ color: '#3b82f6' }} />
                      <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>
                        Two-factor authentication required
                      </p>
                    </div>
                    <p className="text-xs" style={{ color: '#64748b' }}>
                      Enter the 6-digit code from your authenticator app, or a backup code, to continue.
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoFocus
                      value={mfaCode}
                      onChange={(e) => { setMfaCode(e.target.value); if (mfaError) setMfaError(false) }}
                      className="input text-center tracking-[0.5em] text-base"
                      placeholder="______"
                      maxLength={12}
                      autoComplete="one-time-code"
                      aria-invalid={mfaError}
                      style={mfaError ? { borderColor: 'rgba(239,68,68,0.6)', boxShadow: '0 0 0 3px rgba(239,68,68,0.12)' } : undefined}
                    />
                    {mfaError && (
                      <p className="text-xs" style={{ color: '#f87171' }}>
                        Invalid verification code. Try again.
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => { setMfaStep(null); setMfaCode(''); setMfaError(false) }}
                      className="text-xs transition-colors hover:text-blue-300"
                      style={{ color: '#3b82f6' }}
                    >
                      Use a different account
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm text-white
                             flex items-center justify-center gap-2 mt-1
                             transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: loading ? 'none' : '0 0 32px rgba(37,99,235,0.45), 0 2px 4px rgba(0,0,0,0.4)',
                  }}
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>{mfaStep ? 'Verifying…' : 'Authenticating…'}</span>
                    </>
                  ) : (
                    <>
                      <span>{mfaStep ? 'Verify Code' : 'Sign In'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 pt-5 text-center"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-xs" style={{ color: '#7a96b8' }}>
                  Powered by <span style={{ color: '#8ab3f0' }}>DarkOpsHub</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pb-border-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pb-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(5px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(2px); }
        }
        .pb-shake { animation: pb-shake 0.4s ease-in-out; }
      `}</style>
    </>
  )
}