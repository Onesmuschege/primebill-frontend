import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../../api/auth.api'
import { Wifi, ArrowLeft, CheckCircle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import BRAND from '../../config/brand'

export default function ForgotPassword() {
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return toast.error('Please enter your email address')
    setLoading(true)
    try {
      await forgotPassword({ email })
      setSubmitted(true)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif", background: '#0a0f1e' }}>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, rgba(37,99,235,0.10) 0%, transparent 60%),
                     radial-gradient(ellipse 40% 40% at 80% 80%, rgba(6,182,212,0.06) 0%, transparent 60%)`
      }} />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `linear-gradient(rgba(37,99,235,0.07) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(37,99,235,0.07) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%)',
      }} />

      {/* Logo */}
      <div className="absolute top-6 left-8 flex items-center gap-2.5 z-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', boxShadow: '0 0 12px rgba(37,99,235,0.4)' }}>
          <Wifi size={15} className="text-white" />
        </div>
        <span className="text-white font-bold text-base tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>{BRAND.brand}</span>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[400px]">
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>

          {/* Top accent */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #2563eb 40%, #06b6d4 60%, transparent)' }} />

          <div className="px-8 pt-10 pb-10">
            {!submitted ? (
              <>
                <div className="mb-8">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                    style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
                    <Mail size={20} style={{ color: '#60a5fa' }} />
                  </div>
                  <h1 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
                    Reset your password
                  </h1>
                  <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                    Enter your admin email and we'll send a reset link to your inbox.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input"
                      placeholder="admin@primebill.co.ke"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm text-white
                               flex items-center justify-center gap-2
                               transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                      boxShadow: loading ? 'none' : '0 0 24px rgba(37,99,235,0.3)',
                    }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* ── Success state ── */
              <div className="py-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <CheckCircle size={22} className="text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: "'DM Mono', monospace" }}>
                  Check your inbox
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  If <span className="text-slate-300 font-medium">{email}</span> is registered, a reset link is on its way.
                </p>
                <p className="text-xs text-slate-600 mt-2">
                  Don't see it? Check your spam folder.
                </p>
              </div>
            )}

            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <Link to="/login"
                className="inline-flex items-center gap-1.5 text-sm transition-colors"
                style={{ color: '#60a5fa' }}
                onMouseEnter={e => e.currentTarget.style.color='#93c5fd'}
                onMouseLeave={e => e.currentTarget.style.color='#60a5fa'}>
                <ArrowLeft size={14} />
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Powered by <span className="text-slate-600 font-medium">DarkOpsHub</span>
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500;600;700&display=swap');
      `}</style>
    </div>
  )
}