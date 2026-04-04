import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Wrench, Eye, EyeOff, Users, BarChart3, Monitor, ArrowRight } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    const result = login(email, password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  const fillDemo = () => {
    setEmail('user@repairms.com')
    setPassword('user123')
    setError('')
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0b1326' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col w-[420px] flex-shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0f1d40 0%, #0b1326 40%, #071120 100%)' }}>
        {/* Floating orbs */}
        <div className="orb w-64 h-64 top-10 -left-20 animate-float" style={{ background: '#62df7d' }} />
        <div className="orb w-48 h-48 bottom-20 right-0 animate-float-slow" style={{ background: '#adc6ff', animationDelay: '2s' }} />

        <div className="relative z-10 flex flex-col h-full p-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #62df7d, #1ca64d)', boxShadow: '0 0 30px rgba(98,223,125,0.4)' }}>
              <Wrench size={22} color="#003914" strokeWidth={2.5} />
            </div>
            <div>
              <span className="font-display font-bold text-xl text-on-surface">RepairMS</span>
              <p className="text-xs text-on-surface-variant">Enterprise Platform</p>
            </div>
          </div>

          {/* Hero text */}
          <div className="mt-auto mb-12">
            <h2 className="font-display font-extrabold text-4xl text-on-surface leading-tight mb-4">
              Repair & Device<br />
              <span className="text-gradient-green">Management</span><br />
              System
            </h2>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Track every repair, manage device requests, and gain powerful insights into your IT operations — all in one place.
            </p>
          </div>

          {/* Feature pills */}
          <div className="space-y-3">
            {[
              { icon: Wrench, text: 'Full lifecycle repair tracking' },
              { icon: Monitor, text: 'Device request management' },
              { icon: BarChart3, text: 'Analytics & reporting suite' },
              { icon: Users, text: 'User & team management' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 glass-card px-4 py-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(98,223,125,0.1)' }}>
                  <Icon size={14} className="text-primary" />
                </div>
                <span className="text-sm text-on-surface-variant">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6" style={{ background: '#131b2e' }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #62df7d, #1ca64d)' }}>
              <Wrench size={16} color="#003914" />
            </div>
            <span className="font-display font-bold text-lg text-on-surface">RepairMS</span>
          </div>

          <div className="section-card" style={{ background: '#1e2a42', border: '1px solid rgba(62,74,61,0.2)' }}>
            <div className="mb-6">
              <h1 className="font-display font-extrabold text-2xl text-on-surface">Welcome back</h1>
              <p className="text-sm text-on-surface-variant mt-1">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="user@repairms.com"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="input-field pr-11"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-xl text-sm text-error"
                  style={{ background: 'rgba(147,0,10,0.2)', border: '1px solid rgba(255,180,171,0.2)' }}>
                  {error}
                </div>
              )}

              <button id="sign-in-btn" type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base mt-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                    Signing in…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">Sign In <ArrowRight size={16} /></span>
                )}
              </button>
            </form>

            {/* Demo credentials */}
            <div className="mt-5 pt-5 border-t border-outline-variant/15">
              <p className="text-xs text-on-surface-variant mb-2 font-semibold uppercase tracking-wider">Demo Credentials</p>
              <div className="rounded-xl p-3 text-xs space-y-1" style={{ background: 'rgba(98,223,125,0.06)', border: '1px solid rgba(98,223,125,0.15)' }}>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Email</span>
                  <code className="text-primary">user@repairms.com</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Password</span>
                  <code className="text-primary">user123</code>
                </div>
              </div>
              <button onClick={fillDemo} id="use-demo-btn"
                className="btn-secondary w-full justify-center mt-3 text-xs py-2">
                Use Demo Credentials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
