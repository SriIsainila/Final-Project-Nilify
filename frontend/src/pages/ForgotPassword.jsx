import { useState } from 'react'
import { ArrowLeft, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../services/authService.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      const result = await requestPasswordReset(email)
      setMessage(result.message)
    } catch (requestError) {
      setError(requestError.message || 'Could not request a password reset. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page max-w-sm mx-auto px-6 py-20">
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-7 focus-ring rounded">
        <ArrowLeft size={16} /> Back to login
      </Link>
      <h1 className="font-display text-3xl font-bold mb-2">Forgot your password?</h1>
      <p className="text-muted mb-8 text-sm leading-6">Enter your registered email and we’ll send you a secure reset link.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reset-email" className="block text-sm text-muted mb-1.5">Email</label>
          <div className="relative">
            <Mail size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-night-surface border border-ink/15 rounded-lg pl-11 pr-4 py-2.5 focus-ring outline-none" placeholder="you@example.com" />
          </div>
        </div>
        {error && <p className="text-coral text-sm">{error}</p>}
        {message && <p className="text-mint text-sm leading-6">{message}</p>}
        <button type="submit" disabled={loading || Boolean(message)} className="w-full bg-gold text-night font-semibold py-2.5 rounded-full hover:bg-gold-soft transition-colors focus-ring disabled:opacity-60">
          {loading ? 'Sending reset link…' : 'Send reset link'}
        </button>
      </form>
    </div>
  )
}
