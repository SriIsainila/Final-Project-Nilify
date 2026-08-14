import { useMemo, useState } from 'react'
import { ArrowLeft, Check, CreditCard, Lock } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { createCheckout, submitHostedCheckout } from '../services/billingService.js'
import { subscriptionPlansById as plans } from '../data/subscriptionPlans.js'

function readCheckoutDetails() {
  try {
    return JSON.parse(sessionStorage.getItem('nilify:checkout'))
  } catch {
    return null
  }
}

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function isValidVisa(number) {
  const digits = number.replace(/\D/g, '')
  if (!/^4\d{12}(?:\d{3})?$/.test(digits)) return false
  let sum = 0
  let doubleDigit = false
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index])
    if (doubleDigit) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    doubleDigit = !doubleDigit
  }
  return sum % 10 === 0
}

function isValidExpiry(value) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(value)
  if (!match) return false
  const expiry = new Date(2000 + Number(match[2]), Number(match[1]), 0, 23, 59, 59)
  return expiry >= new Date()
}

export default function Checkout() {
  const navigate = useNavigate()
  const details = useMemo(readCheckoutDetails, [])
  const [card, setCard] = useState({ name: '', number: '', expiry: '', cvv: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!details || !plans[details.plan]) return <Navigate to="/pricing" replace />
  const plan = plans[details.plan]

  function updateExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setCard({ ...card, expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits })
  }

  async function handlePayment(event) {
    event.preventDefault()
    setError('')
    if (!card.name.trim()) return setError('Enter the name shown on your Visa card.')
    if (!isValidVisa(card.number)) return setError('Enter a valid Visa card number.')
    if (!isValidExpiry(card.expiry)) return setError('Enter a valid future expiry date.')
    if (!/^\d{3}$/.test(card.cvv)) return setError('Enter the 3-digit security code.')

    setLoading(true)
    try {
      // Card values remain in this browser and are never sent to Nilify's API.
      const checkout = await createCheckout(details)
      sessionStorage.setItem('nilify:payhere-order-id', checkout.fields.order_id)
      setCard({ name: '', number: '', expiry: '', cvv: '' })
      submitHostedCheckout(checkout)
    } catch (paymentError) {
      setError(paymentError.message || 'Could not start secure payment.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <button type="button" onClick={() => navigate('/pricing')} className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink mb-8 focus-ring rounded-md">
        <ArrowLeft size={16} /> Back to billing details
      </button>

      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="text-mint text-xs font-semibold uppercase tracking-[0.16em]">Secure checkout</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight mt-3">Complete your subscription</h1>
        <p className="text-muted text-sm sm:text-base leading-6 mt-3">Review your selected plan and enter your Visa card details below.</p>
      </div>

      <div className="checkout-layout">
        <section className="checkout-card checkout-plan-card min-w-0 bg-night-surface border border-ink/10 rounded-3xl shadow-sm">
          <p className="text-xs text-mint font-semibold uppercase tracking-wider">Selected plan</p>
          <h2 className="font-display text-xl sm:text-2xl font-bold leading-tight mt-3">{plan.name}</h2>
          <p className="font-display text-3xl sm:text-4xl font-bold leading-none mt-5 break-words">Rs. {plan.price.toLocaleString()}</p>
          <p className="text-muted text-sm leading-6 mt-2">For {plan.duration}, automatically renewed</p>
          <div className="border-t border-ink/10 mt-7 pt-6 space-y-4 text-sm leading-5">
            <p className="flex items-start gap-3"><Check size={16} className="text-mint shrink-0 mt-0.5" /> <span>Track up to {plan.urls} URL{plan.urls > 1 ? 's' : ''}</span></p>
            <p className="flex items-start gap-3"><Check size={16} className="text-mint shrink-0 mt-0.5" /> <span>Price and stock notifications</span></p>
            <p className="flex items-start gap-3"><Check size={16} className="text-mint shrink-0 mt-0.5" /> <span>Gemini buy-or-wait advice</span></p>
          </div>
          <button type="button" onClick={() => navigate('/pricing')} className="text-gold text-sm font-semibold leading-5 mt-7 focus-ring rounded-md">
            Change subscription plan →
          </button>
        </section>

        <form onSubmit={handlePayment} className="checkout-card checkout-form min-w-0 bg-night-surface border border-ink/10 rounded-3xl shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-bold leading-tight">Payment method</h2>
              <p className="text-muted text-sm leading-5 mt-2">Visa cards only</p>
            </div>
            <div className="rounded-lg bg-[#1434CB] text-white font-bold italic px-3 py-1.5">VISA</div>
          </div>

          <div className="checkout-field">
            <label htmlFor="card-name" className="block text-sm text-muted mb-1.5">Name on card</label>
            <input id="card-name" autoComplete="cc-name" required value={card.name} onChange={(event) => setCard({ ...card, name: event.target.value })} className="w-full min-w-0 bg-white border border-ink/15 rounded-xl px-4 py-3.5 text-base focus-ring outline-none" placeholder="Name shown on card" />
          </div>
          <div className="checkout-field">
            <label htmlFor="card-number" className="block text-sm text-muted mb-1.5">Visa card number</label>
            <div className="relative">
              <CreditCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input id="card-number" inputMode="numeric" autoComplete="cc-number" required value={card.number} onChange={(event) => setCard({ ...card, number: formatCardNumber(event.target.value) })} className="w-full min-w-0 bg-white border border-ink/15 rounded-xl pl-11 pr-4 py-3.5 text-base focus-ring outline-none tracking-wider" placeholder="4xxx xxxx xxxx xxxx" />
            </div>
          </div>
          <div className="checkout-field-row">
            <div className="checkout-field min-w-0">
              <label htmlFor="card-expiry" className="block text-sm text-muted mb-1.5">Expiry date</label>
              <input id="card-expiry" inputMode="numeric" autoComplete="cc-exp" required value={card.expiry} onChange={(event) => updateExpiry(event.target.value)} className="w-full min-w-0 bg-white border border-ink/15 rounded-xl px-4 py-3.5 text-base focus-ring outline-none" placeholder="MM/YY" />
            </div>
            <div className="checkout-field min-w-0">
              <label htmlFor="card-cvv" className="block text-sm text-muted mb-1.5">CVV</label>
              <input id="card-cvv" type="password" inputMode="numeric" autoComplete="cc-csc" required maxLength={3} value={card.cvv} onChange={(event) => setCard({ ...card, cvv: event.target.value.replace(/\D/g, '').slice(0, 3) })} className="w-full min-w-0 bg-white border border-ink/15 rounded-xl px-4 py-3.5 text-base focus-ring outline-none" placeholder="•••" />
            </div>
          </div>

          {error && <p className="text-coral text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full flex flex-wrap items-center justify-center gap-2 bg-gold text-night text-sm sm:text-base font-semibold leading-5 px-5 py-3.5 rounded-full hover:bg-gold-soft focus-ring disabled:opacity-60">
            <Lock size={16} className="shrink-0" /> <span>{loading ? 'Preparing secure payment…' : `Pay Rs. ${plan.price.toLocaleString()} with Visa`}</span>
          </button>
          <p className="text-muted text-xs text-center leading-relaxed">
            Card details are validated only in your browser and are never stored by Nilify. Final payment is securely processed by PayHere.
          </p>
        </form>
      </div>
    </div>
  )
}
