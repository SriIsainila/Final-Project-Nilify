import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'
import { homeForRole } from '../routes/roleAccess.js'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailLocked, setEmailLocked] = useState(true)
  const [passwordLocked, setPasswordLocked] = useState(true)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    setLoading(true)
    try {
      const result = await login(form.email, form.password)
      const defaultPath = homeForRole(result.user.role)
      const requestedPath = location.state?.from?.pathname
      const allowedRequestedPath = result.user.role === 'admin'
        ? requestedPath?.startsWith('/admin')
        : requestedPath && !requestedPath.startsWith('/admin')
      navigate(allowedRequestedPath ? requestedPath : defaultPath, { replace: true })
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page max-w-sm mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-bold mb-2">Welcome back</h1>
      <p className="text-muted mb-8 text-sm">Log in to see what's dropped in price.</p>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        <input type="text" name="username" autoComplete="username" className="hidden" tabIndex={-1} aria-hidden="true" />
        <input type="password" name="password" autoComplete="current-password" className="hidden" tabIndex={-1} aria-hidden="true" />
        <div>
          <label htmlFor="email" className="block text-sm text-muted mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="nilify-login-email"
            type="email"
            autoComplete="one-time-code"
            readOnly={emailLocked}
            onFocus={() => setEmailLocked(false)}
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-night-surface border border-ink/15 rounded-lg px-4 py-2.5 focus-ring outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <label htmlFor="password" className="block text-sm text-muted">Password</label>
            <Link to="/forgot-password" className="text-sm text-gold hover:text-gold-soft focus-ring rounded">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="nilify-login-secret"
            type="password"
            autoComplete="one-time-code"
            readOnly={passwordLocked}
            onFocus={() => setPasswordLocked(false)}
            required
            title="Enter your password."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-night-surface border border-ink/15 rounded-lg px-4 py-2.5 focus-ring outline-none"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-coral text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-night font-semibold py-2.5 rounded-full hover:bg-gold-soft transition-colors focus-ring disabled:opacity-60"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        New to Nilify?{' '}
        <Link to="/register" className="text-gold hover:text-gold-soft focus-ring rounded">
          Create an account
        </Link>
      </p>
    </div>
  )
}
