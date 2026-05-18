import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, ArrowRight, Wifi, Zap, Globe, Server } from 'lucide-react'
import toast from 'react-hot-toast'

const STATS = [
  { icon: Globe,  label: 'Uptime',    value: '99.9%' },
  { icon: Zap,    label: 'Avg Speed', value: '1 Gbps' },
  { icon: Server, label: 'Nodes',     value: '240+' },
  { icon: Wifi,   label: 'Clients',   value: '12k+' },
]

function NetworkTopology() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 800 700"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="glow-node">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-core">
          <feGaussianBlur stdDeviation="6" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-pkt">
          <feGaussianBlur stdDeviation="2.5" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <radialGradient id="core-blob" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45"/>
          <stop offset="100%" stopColor="#2563eb" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id="bg-grad" cx="38%" cy="38%" r="65%">
          <stop offset="0%" stopColor="#0d1829"/>
          <stop offset="100%" stopColor="#070d1a"/>
        </radialGradient>
        {/* Motion paths */}
        <path id="mp-a" d="M400,330 L210,180"/>
        <path id="mp-b" d="M590,180 L400,330"/>
        <path id="mp-c" d="M400,330 L590,490"/>
        <path id="mp-d" d="M210,490 L400,330"/>
        <path id="mp-e" d="M400,330 L100,330"/>
        <path id="mp-f" d="M700,330 L400,330"/>
        <path id="mp-g" d="M400,330 L590,180"/>
        <path id="mp-h" d="M210,180 L400,330"/>
        <path id="mp-i" d="M210,180 L90,80"/>
        <path id="mp-j" d="M590,180 L710,80"/>
        <path id="mp-k" d="M210,490 L90,590"/>
        <path id="mp-l" d="M590,490 L710,590"/>
        <path id="mp-m" d="M100,330 L50,220"/>
        <path id="mp-n" d="M700,330 L750,440"/>
        <path id="mp-o" d="M400,330 L210,490"/>
        <path id="mp-p" d="M590,490 L400,330"/>
      </defs>

      {/* Dark background */}
      <rect width="800" height="700" fill="url(#bg-grad)"/>

      {/* Grid lines */}
      {[70,140,210,280,350,420,490,560,630,700,770].map(x => (
        <line key={`gv${x}`} x1={x} y1="0" x2={x} y2="700" stroke="rgba(37,99,235,0.055)" strokeWidth="0.5"/>
      ))}
      {[70,140,210,280,350,420,490,560,630].map(y => (
        <line key={`gh${y}`} x1="0" y1={y} x2="800" y2={y} stroke="rgba(37,99,235,0.055)" strokeWidth="0.5"/>
      ))}

      {/* Core glow halos */}
      <circle cx="400" cy="330" r="110" fill="url(#core-blob)">
        <animate attributeName="r" values="95;130;95" dur="5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.7;1;0.7" dur="5s" repeatCount="indefinite"/>
      </circle>
      <circle cx="400" cy="330" r="190" fill="url(#core-blob)" opacity="0.25">
        <animate attributeName="r" values="170;210;170" dur="7s" begin="1s" repeatCount="indefinite"/>
      </circle>

      {/* ── Backbone fiber links ── */}
      <line x1="400" y1="330" x2="210" y2="180" stroke="#1d4ed8" strokeWidth="1.3" fill="none" strokeDasharray="7 8">
        <animate attributeName="strokeOpacity" values="0.25;0.85;0.25" dur="2.6s" repeatCount="indefinite"/>
      </line>
      <line x1="400" y1="330" x2="590" y2="180" stroke="#1d4ed8" strokeWidth="1.3" fill="none" strokeDasharray="7 8">
        <animate attributeName="strokeOpacity" values="0.25;0.85;0.25" dur="2.9s" begin="0.3s" repeatCount="indefinite"/>
      </line>
      <line x1="400" y1="330" x2="210" y2="490" stroke="#0891b2" strokeWidth="1.3" fill="none" strokeDasharray="7 8">
        <animate attributeName="strokeOpacity" values="0.2;0.75;0.2" dur="3.1s" begin="0.6s" repeatCount="indefinite"/>
      </line>
      <line x1="400" y1="330" x2="590" y2="490" stroke="#0891b2" strokeWidth="1.3" fill="none" strokeDasharray="7 8">
        <animate attributeName="strokeOpacity" values="0.2;0.75;0.2" dur="2.7s" begin="1s" repeatCount="indefinite"/>
      </line>
      <line x1="400" y1="330" x2="100" y2="330" stroke="#1e3a8a" strokeWidth="1" fill="none" strokeDasharray="5 7">
        <animate attributeName="strokeOpacity" values="0.2;0.65;0.2" dur="4s" repeatCount="indefinite"/>
      </line>
      <line x1="400" y1="330" x2="700" y2="330" stroke="#1e3a8a" strokeWidth="1" fill="none" strokeDasharray="5 7">
        <animate attributeName="strokeOpacity" values="0.2;0.65;0.2" dur="3.5s" begin="0.8s" repeatCount="indefinite"/>
      </line>

      {/* Distribution ring (backbone ring) */}
      <path d="M210,180 Q400,75 590,180"  fill="none" stroke="#1d4ed8" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="4 10"/>
      <path d="M590,180 Q725,330 590,490"  fill="none" stroke="#0891b2" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="4 10"/>
      <path d="M590,490 Q400,600 210,490"  fill="none" stroke="#1d4ed8" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="4 10"/>
      <path d="M210,490 Q75,330 210,180"   fill="none" stroke="#0891b2" strokeWidth="0.8" strokeOpacity="0.2" strokeDasharray="4 10"/>

      {/* Edge feeder links */}
      {[
        [210,180,90,80],[210,180,300,70],[590,180,500,70],[590,180,710,80],
        [210,490,90,590],[210,490,290,610],[590,490,500,610],[590,490,710,590],
        [100,330,50,220],[100,330,50,440],[700,330,750,220],[700,330,750,440],
      ].map(([x1,y1,x2,y2],i) => (
        <line key={`el${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#1e3a5f" strokeWidth="0.8" fill="none" strokeDasharray="3 6" strokeOpacity="0.5"/>
      ))}

      {/* ── Animated data packets ── */}
      {[
        {path:'#mp-a', dur:'2.2s', begin:'0s',   r:3.5, fill:'#22d3ee'},
        {path:'#mp-b', dur:'2.5s', begin:'0.5s', r:3,   fill:'#60a5fa'},
        {path:'#mp-c', dur:'2.8s', begin:'1s',   r:3.5, fill:'#22d3ee'},
        {path:'#mp-d', dur:'2.4s', begin:'1.5s', r:3,   fill:'#60a5fa'},
        {path:'#mp-e', dur:'3s',   begin:'0.8s', r:2.5, fill:'#a5f3fc'},
        {path:'#mp-f', dur:'2.7s', begin:'1.2s', r:2.5, fill:'#93c5fd'},
        {path:'#mp-g', dur:'2.6s', begin:'2s',   r:3,   fill:'#22d3ee'},
        {path:'#mp-h', dur:'3.2s', begin:'0.6s', r:2.5, fill:'#60a5fa'},
        {path:'#mp-i', dur:'1.8s', begin:'0.3s', r:2,   fill:'#a5f3fc'},
        {path:'#mp-j', dur:'2s',   begin:'1.4s', r:2,   fill:'#a5f3fc'},
        {path:'#mp-k', dur:'1.9s', begin:'0.9s', r:2,   fill:'#93c5fd'},
        {path:'#mp-l', dur:'2.1s', begin:'1.7s', r:2,   fill:'#93c5fd'},
        {path:'#mp-m', dur:'1.7s', begin:'0.4s', r:2,   fill:'#22d3ee'},
        {path:'#mp-n', dur:'2s',   begin:'1.6s', r:2,   fill:'#60a5fa'},
        {path:'#mp-o', dur:'2.9s', begin:'0.7s', r:3,   fill:'#22d3ee'},
        {path:'#mp-p', dur:'2.3s', begin:'1.9s', r:2.5, fill:'#60a5fa'},
      ].map((pk,i) => (
        <circle key={i} r={pk.r} fill={pk.fill} filter="url(#glow-pkt)">
          <animateMotion dur={pk.dur} repeatCount="indefinite" begin={pk.begin}>
            <mpath href={pk.path}/>
          </animateMotion>
        </circle>
      ))}

      {/* ── CORE router ── */}
      <g filter="url(#glow-core)">
        <rect x="372" y="302" width="56" height="56" rx="11" fill="#1d4ed8" stroke="#60a5fa" strokeWidth="1.8"/>
        <line x1="385" y1="322" x2="416" y2="322" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="385" y1="330" x2="416" y2="330" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="385" y1="338" x2="416" y2="338" stroke="#bfdbfe" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="422" cy="322" r="2.5" fill="#22d3ee"/>
        <circle cx="422" cy="330" r="2.5" fill="#22d3ee"/>
        <circle cx="422" cy="338" r="2.5" fill="#22d3ee"/>
      </g>
      <text x="400" y="375" fontFamily="'DM Mono',monospace" fontSize="9" fill="#3b82f6" textAnchor="middle" fontWeight="600">CORE-01</text>
      <text x="400" y="385" fontFamily="'DM Mono',monospace" fontSize="7" fill="#1e3a5f" textAnchor="middle">NAIROBI-IX</text>

      {/* ── Distribution routers ── */}
      {[
        {x:188, y:158, label:'DIST-NW', sub:'WESTLANDS'},
        {x:568, y:158, label:'DIST-NE', sub:'KASARANI'},
        {x:188, y:468, label:'DIST-SW', sub:"LANG'ATA"},
        {x:568, y:468, label:'DIST-SE', sub:'EMBAKASI'},
      ].map(({x,y,label,sub}) => (
        <g key={label} filter="url(#glow-node)">
          <rect x={x} y={y} width="44" height="44" rx="8" fill="#0e7490" stroke="#22d3ee" strokeWidth="1"/>
          <line x1={x+10} y1={y+14} x2={x+32} y2={y+14} stroke="#a5f3fc" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1={x+10} y1={y+20} x2={x+32} y2={y+20} stroke="#a5f3fc" strokeWidth="1.2" strokeLinecap="round"/>
          <line x1={x+10} y1={y+26} x2={x+32} y2={y+26} stroke="#a5f3fc" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx={x+36} cy={y+14} r="1.5" fill="#22d3ee"/>
          <circle cx={x+36} cy={y+20} r="1.5" fill="#22d3ee"/>
          <circle cx={x+36} cy={y+26} r="1.5" fill="#22d3ee"/>
          <text x={x+22} y={y+57} fontFamily="'DM Mono',monospace" fontSize="8" fill="#0891b2" textAnchor="middle">{label}</text>
          <text x={x+22} y={y+67} fontFamily="'DM Mono',monospace" fontSize="7" fill="#1e3a5f" textAnchor="middle">{sub}</text>
        </g>
      ))}

      {/* ── Edge routers (W & E) ── */}
      {[
        {x:78,  y:312, label:'EDGE-W'},
        {x:678, y:312, label:'EDGE-E'},
      ].map(({x,y,label}) => (
        <g key={label} filter="url(#glow-node)">
          <rect x={x} y={y} width="44" height="36" rx="6" fill="#0f2040" stroke="#1d4ed8" strokeWidth="1"/>
          <line x1={x+9}  y1={y+12} x2={x+31} y2={y+12} stroke="#60a5fa" strokeWidth="1" strokeLinecap="round"/>
          <line x1={x+9}  y1={y+18} x2={x+31} y2={y+18} stroke="#60a5fa" strokeWidth="1" strokeLinecap="round"/>
          <line x1={x+9}  y1={y+24} x2={x+31} y2={y+24} stroke="#60a5fa" strokeWidth="1" strokeLinecap="round"/>
          <text x={x+22} y={y+48} fontFamily="'DM Mono',monospace" fontSize="7" fill="#1d4ed8" textAnchor="middle">{label}</text>
        </g>
      ))}

      {/* ── Client / CPE endpoint nodes ── */}
      {[
        {cx:90,  cy:80,  d:'3.2s', b:'0s'},
        {cx:300, cy:70,  d:'2.7s', b:'0.4s'},
        {cx:500, cy:70,  d:'3s',   b:'0.8s'},
        {cx:710, cy:80,  d:'2.5s', b:'1.2s'},
        {cx:90,  cy:590, d:'2.8s', b:'0.6s'},
        {cx:290, cy:610, d:'3.2s', b:'1s'},
        {cx:500, cy:610, d:'2.6s', b:'1.4s'},
        {cx:710, cy:590, d:'3.1s', b:'0.2s'},
        {cx:50,  cy:220, d:'2.4s', b:'0.3s'},
        {cx:50,  cy:440, d:'2.9s', b:'1.1s'},
        {cx:750, cy:220, d:'2.7s', b:'0.7s'},
        {cx:750, cy:440, d:'3.3s', b:'1.6s'},
      ].map((n,i) => (
        <g key={`cpe${i}`} filter="url(#glow-node)">
          <circle cx={n.cx} cy={n.cy} r="10" fill="#0a1220" stroke="#1d4ed8" strokeWidth="0.8"/>
          <circle cx={n.cx} cy={n.cy} r="4" fill="#1d4ed8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur={n.d} begin={n.b} repeatCount="indefinite"/>
            <animate attributeName="r" values="3;5.5;3" dur={n.d} begin={n.b} repeatCount="indefinite"/>
          </circle>
          <circle cx={n.cx} cy={n.cy} r="14" fill="none" stroke="#1d4ed8" strokeWidth="0.6">
            <animate attributeName="r" values="10;20;10" dur={n.d} begin={n.b} repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.4;0;0.4" dur={n.d} begin={n.b} repeatCount="indefinite"/>
          </circle>
        </g>
      ))}

      {/* Layer callout labels */}
      <text x="400" y="22" fontFamily="'DM Mono',monospace" fontSize="8" fill="#1e3a5f" textAnchor="middle" letterSpacing="4">— BACKBONE LAYER —</text>
      <text x="400" y="692" fontFamily="'DM Mono',monospace" fontSize="7" fill="#0f172a" textAnchor="middle" letterSpacing="2">ISP NETWORK TOPOLOGY · PRIMEBILL · DARKOPSHUB</text>
    </svg>
  )
}

export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '', remember: false })
  const [showPass, setShowPass] = useState(false)
  const { login, loading }      = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login({ email: form.email, password: form.password })
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      toast.error(result.message)
    }
  }

  return (
    <div className="min-h-screen flex overflow-hidden"
      style={{ fontFamily: "'DM Sans', ui-sans-serif, system-ui, sans-serif", background: '#070d1a' }}>

      {/* ── Left Panel — Live network topology ── */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-12 overflow-hidden">
        <NetworkTopology />

        {/* Edge fades */}
        <div className="absolute inset-y-0 right-0 w-36 pointer-events-none"
          style={{ background: 'linear-gradient(to right, transparent, #0a0f1e)' }}/>
        <div className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #070d1a)' }}/>
        <div className="absolute inset-x-0 top-0 h-20 pointer-events-none"
          style={{ background: 'linear-gradient(to top, transparent, rgba(7,13,26,0.5))' }}/>

        {/* Brand top-left */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', boxShadow: '0 0 22px rgba(37,99,235,0.65)' }}>
              <Wifi size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight"
              style={{ fontFamily: "'DM Mono', monospace" }}>PrimeBill</span>
          </div>
        </div>

        {/* Tagline + stats */}
        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-bold text-white leading-tight tracking-tight"
              style={{ fontFamily: "'DM Mono', monospace" }}>
              Manage your<br />
              <span style={{ background: 'linear-gradient(90deg, #60a5fa, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ISP network
              </span><br />
              with precision.
            </h2>
            <p className="mt-4 text-sm leading-relaxed max-w-xs" style={{ color: '#475569' }}>
              Real-time billing, client management, and network monitoring — built for African ISPs.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(37,99,235,0.18)' }}>
                  <Icon size={14} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-none">{value}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-xs" style={{ color: '#1e3a5f' }}>© 2026 DarkOpsHub · PrimeBill ISP Platform</p>
        </div>
      </div>

      {/* ── Right Panel — Login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12 relative"
        style={{ background: '#0a0f1e', borderLeft: '1px solid rgba(255,255,255,0.04)' }}>

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-8 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
            <Wifi size={15} className="text-white" />
          </div>
          <span className="text-white font-bold text-base" style={{ fontFamily: "'DM Mono', monospace" }}>PrimeBill</span>
        </div>

        <div className="w-full max-w-[380px]">
          {/* Status badge */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              All systems operational
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: "'DM Mono', monospace" }}>
              Welcome back
            </h1>
            <p className="text-sm mt-1" style={{ color: '#475569' }}>Sign in to your admin dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: '#475569' }}>
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="admin@primebill.co.ke"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-medium uppercase tracking-wider" style={{ color: '#475569' }}>
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs transition-colors" style={{ color: '#3b82f6' }}>
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#334155' }}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer pt-1">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={form.remember}
                  onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                  className="sr-only"
                />
                <div className="w-4 h-4 rounded-[4px] border transition-all flex items-center justify-center"
                  style={{
                    borderColor: form.remember ? '#2563eb' : '#1e293b',
                    backgroundColor: form.remember ? '#2563eb' : 'transparent',
                  }}>
                  {form.remember && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 4l2.5 2.5L9 1"/>
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm select-none" style={{ color: '#475569' }}>Remember me for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-white
                         flex items-center justify-center gap-2 mt-2
                         transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: loading ? 'none' : '0 0 28px rgba(37,99,235,0.4), 0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-xs" style={{ color: '#1e3a5f' }}>
              Powered by <span className="font-medium" style={{ color: '#334155' }}>DarkOpsHub</span>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  )
}