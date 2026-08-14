import { useState } from 'react'
import { Lock } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../services/authService.js'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!token) return setError('This password reset link is incomplete.')
    if (form.password.length < 8) return setError('Use at least 8 characters for your new password.')
    if (form.password !== form.confirmPassword) return setError('The passwords do not match.')
    setLoading(true)
    try {
      const result = await resetPassword(token, form.password)
      setMessage(result.message)
      setForm({ password: '', confirmPassword: '' })
    } catch (resetError) {
      setError(resetError.message || 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page max-w-sm mx-auto px-6 py-20">
      <h1 className="font-display text-3xl font-bold mb-2">Choose a new password</h1>
      <p className="text-muted mb-8 text-sm leading-6">Your new password must contain at least 8 characters.</p>

      {message ? (
        <div className="bg-night-surface border border-ink/10 rounded-2xl p-6 text-center">
          <p className="text-mint text-sm leading-6 mb-5">{message}</p>
          <Link to="/login" className="inline-flex bg-gold text-night font-semibold px-6 py-2.5 rounded-full hover:bg-gold-soft focus-ring">Go to login</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {['password', 'confirmPassword'].map((field) => (
            <div key={field}>
              <label htmlFor={field} className="block text-sm text-muted mb-1.5">
                {field === 'password' ? 'New password' : 'Confirm new password'}
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input id={field} type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} className="w-full bg-night-surface border border-ink/15 rounded-lg pl-11 pr-4 py-2.5 focus-ring outline-none" placeholder="At least 8 characters" />
              </div>
            </div>
          ))}
          {error && <p className="text-coral text-sm">{error}</p>}
          <button type="submit" disabled={loading || !token} className="w-full bg-gold text-night font-semibold py-2.5 rounded-full hover:bg-gold-soft transition-colors focus-ring disabled:opacity-60">
            {loading ? 'Resetting password…' : 'Reset password'}
          </button>
          {!token && <Link to="/forgot-password" className="block text-center text-sm text-gold">Request a new reset link</Link>}
        </form>
      )}
    </div>
  )
}
