import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [editable, setEditable] = useState({ name: false, email: false, password: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page max-w-sm mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-bold mb-2">Create your account</h1>
      <p className="text-muted mb-8 text-sm">Free to start. Track your first product in a minute.</p>

      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm text-muted mb-1.5">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="off"
            readOnly={!editable.name}
            onFocus={() => setEditable((current) => ({ ...current, name: true }))}
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-night-surface border border-ink/15 rounded-lg px-4 py-2.5 focus-ring outline-none"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm text-muted mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="registration-email"
            type="email"
            autoComplete="off"
            readOnly={!editable.email}
            onFocus={() => setEditable((current) => ({ ...current, email: true }))}
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full bg-night-surface border border-ink/15 rounded-lg px-4 py-2.5 focus-ring outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-muted mb-1.5">
            Password
          </label>
          <input
            id="password"
            name="new-password"
            type="password"
            autoComplete="new-password"
            readOnly={!editable.password}
            onFocus={() => setEditable((current) => ({ ...current, password: true }))}
            required
            title="Enter a password."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-night-surface border border-ink/15 rounded-lg px-4 py-2.5 focus-ring outline-none"
            placeholder="Enter a password"
          />
          <p className="text-muted text-xs mt-1.5">
            Letters only, numbers only, or both are accepted.
          </p>
        </div>

        {error && <p className="text-coral text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gold text-night font-semibold py-2.5 rounded-full hover:bg-gold-soft transition-colors focus-ring disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-muted mt-6 text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-gold hover:text-gold-soft focus-ring rounded">
          Log in
        </Link>
      </p>
    </div>
  )
}
