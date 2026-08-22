import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../api/auth.api'
import { Wifi, KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import BRAND from '../../config/brand'

export default function ResetPassword() {
  const [searchParams]          = useSearchParams()
  const navigate                = useNavigate()
  const [showPass, setShowPass]  = useState(false)
  const [showConf, setShowConf]  = useState(false)
  const [loading, setLoading]    = useState(false)
  const [done, setDone]          = useState(false)
  const [form, setForm]          = useState({
    email:                 searchParams.get('email') || '',
    token:                 searchParams.get('token') || '',
    password:              '',
    password_confirmation: '',
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.password_confirmation) e.password_confirmation = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await resetPassword(form)
      setDone(true)
      toast.success('Password reset successfully!')
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      const msg = err.response?.data?.message || 'Reset failed. The link may have expired.'
      toast.error(msg)
      if (err.response?.data?.errors) setErrors(err.response.data.errors)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 65%), #0b1120' }}>

      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(37,99,235,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.06) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 100% 100% at 50% 50%, black 20%, transparent 80%)',
        }}
      />

      <div className="absolute top-6 left-8 flex items-center gap-2.5 z-10">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', boxShadow: '0 0 12px rgba(37,99,235,0.5)' }}>
          <Wifi size={16} className="text-white" />
        </div>
        <span className="text-white font-bold text-base tracking-tight">{BRAND.brand}</span>
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <div className="absolute inset-0 rounded-2xl blur-xl opacity-15"
          style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', transform: 'scale(1.05)' }}
        />

        <div className="relative glass rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' }}>

          <div className="h-0.5 w-full"
            style={{ background: 'linear-gradient(90deg, transparent, #2563eb, #06b6d4, transparent)' }}
          />

          <div className="px-8 pt-8 pb-10">
            {!done ? (
              <>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(6,182,212,0.2))', border: '1px solid rgba(37,99,235,0.4)' }}>
                    <KeyRound size={24} className="text-blue-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">New Password</h1>
                  <p className="text-sm text-slate-400">Choose a strong password for your account.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email (read-only context) */}
                  {form.email && (
                    <div>
                      <label className="label">Account</label>
                      <input type="email" value={form.email} readOnly
                        className="input opacity-60 cursor-not-allowed" />
                    </div>
                  )}

                  {/* New Password */}
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="Min. 8 characters"
                        required
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password}</p>}
                  </div>

                  {/* Confirm */}
                  <div>
                    <label className="label">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showConf ? 'text' : 'password'}
                        value={form.password_confirmation}
                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                        className={`input pr-10 ${errors.password_confirmation ? 'border-red-500' : ''}`}
                        placeholder="Repeat new password"
                        required
                      />
                      <button type="button" onClick={() => setShowConf(!showConf)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.password_confirmation && <p className="text-xs text-red-400 mt-1">{errors.password_confirmation}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm text-white
                               flex items-center justify-center gap-2
                               transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 20px rgba(37,99,235,0.3)' }}
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Resetting...</span>
                      </>
                    ) : 'Reset Password'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Password Reset!</h2>
                <p className="text-sm text-slate-400">Redirecting you to sign in...</p>
                <div className="mt-4 w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
              </div>
            )}

            <div className="mt-6 text-center">
              <Link to="/login" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                Back to Sign In
              </Link>
            </div>

            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              <p className="text-xs text-slate-600">Powered by <span className="text-slate-500 font-medium">DarkOpsHub</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}