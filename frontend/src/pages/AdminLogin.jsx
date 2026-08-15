import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'

export default function AdminLogin() {
  const { user, loading: authLoading, login, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailLocked, setEmailLocked] = useState(true)
  const [passwordLocked, setPasswordLocked] = useState(true)

  if (!authLoading && user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      if (result.user.role !== 'admin') {
        await logout()
        setError('This account does not have administrator access.')
        return
      }
      navigate('/admin/dashboard', { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'Could not sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center bg-[#F4FBF5] px-6 py-14">
      <div className="w-full max-w-sm bg-white rounded-3xl border border-[#1F4D36]/10 shadow-lg shadow-[#1F4D36]/5 p-7 sm:p-9">
        <div className="w-12 h-12 rounded-2xl bg-[#34A853] text-white flex items-center justify-center mb-6"><Bell size={22} /></div>
        <p className="text-[#34A853] text-xs font-semibold uppercase tracking-[0.16em]">Nilify administration</p>
        <h1 className="font-display text-3xl font-bold text-[#1F4D36] mt-2">Admin login</h1>
        <p className="text-muted text-sm leading-6 mt-2 mb-7">Sign in with an authorized administrator account.</p>
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-5">
          <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
          <input type="password" name="password" autoComplete="current-password" className="hidden" tabIndex={-1} aria-hidden="true" />
          <div>
            <label htmlFor="admin-email" className="block text-sm text-muted mb-1.5">Email</label>
            <input id="admin-email" name="nilify-admin-email" type="email" autoComplete="one-time-code" readOnly={emailLocked} onFocus={() => setEmailLocked(false)} required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="w-full border border-ink/15 rounded-xl px-4 py-3 outline-none focus-ring" placeholder="admin@example.com" />
          </div>
          <div>
            <label htmlFor="admin-password" className="block text-sm text-muted mb-1.5">Password</label>
            <input id="admin-password" name="nilify-admin-secret" type="password" autoComplete="one-time-code" readOnly={passwordLocked} onFocus={() => setPasswordLocked(false)} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="w-full border border-ink/15 rounded-xl px-4 py-3 outline-none focus-ring" placeholder="••••••••" />
          </div>
          {error && <p className="text-coral text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-[#34A853] text-white font-semibold py-3 rounded-full hover:bg-[#2f974b] focus-ring disabled:opacity-60">
            {loading ? 'Signing in…' : 'Sign in as admin'}
          </button>
        </form>
      </div>
    </div>
  )
}
