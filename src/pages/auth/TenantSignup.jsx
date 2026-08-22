import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { checkTenantSlug } from '../../api/auth.api'
import { Eye, EyeOff, ArrowRight, Wifi, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import BRAND from '../../config/brand'

export default function TenantSignup() {
  const navigate = useNavigate()
  const { registerTenant, loading } = useAuth()

  const [form, setForm] = useState({
    company_name: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
    admin_password_confirmation: '',
  })
  const [reveal, setReveal] = useState(false)
  const [slugPreview, setSlugPreview] = useState('')
  const slugTimer = useRef(null)

  // Debounced live slug preview as the ISP name is typed
  useEffect(() => {
    if (!form.company_name.trim()) {
      setSlugPreview('')
      return
    }
    clearTimeout(slugTimer.current)
    slugTimer.current = setTimeout(() => {
      checkTenantSlug(form.company_name)
        .then(r => setSlugPreview(r.data.data.slug))
        .catch(() => {})
    }, 400)
    return () => clearTimeout(slugTimer.current)
  }, [form.company_name])

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.admin_password !== form.admin_password_confirmation) {
      toast.error("Passwords don't match")
      return
    }
    if (form.admin_password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    const result = await registerTenant(form)
    if (result.success) {
      toast.success(`Welcome to ${BRAND.product}, ${result.tenant.name}!`)
      navigate('/dashboard')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: '#0a0e1a' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#2563eb,#06b6d4)', boxShadow: '0 0 32px rgba(37,99,235,0.45)' }}>
            <Wifi size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Create your ISP workspace</h1>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            Get your own {BRAND.product} instance in under a minute
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
              Company / ISP Name
            </label>
            <input
              required
              value={form.company_name}
              onChange={e => handleChange('company_name', e.target.value)}
              placeholder="Acme Fiber Ltd"
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            {slugPreview && (
              <p className="text-xs mt-1.5" style={{ color: '#22d3ee' }}>
                Your workspace: app.primebill.app/portal/<strong>{slugPreview}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
              Your Full Name
            </label>
            <input
              required
              value={form.admin_name}
              onChange={e => handleChange('admin_name', e.target.value)}
              placeholder="Jane Doe"
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
              Your Email
            </label>
            <input
              required
              type="email"
              value={form.admin_email}
              onChange={e => handleChange('admin_email', e.target.value)}
              placeholder="jane@acmefiber.co.ke"
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
              Password
            </label>
            <div className="relative">
              <input
                required
                type={reveal ? 'text' : 'password'}
                value={form.admin_password}
                onChange={e => handleChange('admin_password', e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 pr-10 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button type="button" onClick={() => setReveal(r => !r)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#64748b' }}>
                {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
              Confirm Password
            </label>
            <input
              required
              type={reveal ? 'text' : 'password'}
              value={form.admin_password_confirmation}
              onChange={e => handleChange('admin_password_confirmation', e.target.value)}
              placeholder="Re-enter your password"
              className="w-full px-4 py-2.5 rounded-xl text-white text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#2563eb,#06b6d4)', boxShadow: '0 0 24px rgba(37,99,235,0.35)' }}
          >
            {loading ? 'Creating your workspace...' : 'Create Workspace'}
            {!loading && <ArrowRight size={16} />}
          </button>

          <div className="flex items-center gap-2 pt-2 text-xs" style={{ color: '#64748b' }}>
            <CheckCircle2 size={13} style={{ color: '#22d3ee' }} />
            No credit card required — starts on a free trial
          </div>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#64748b' }}>
          Already have a workspace?{' '}
          <Link to="/login" className="font-semibold" style={{ color: '#22d3ee' }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}