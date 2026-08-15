import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, CreditCard } from 'lucide-react'
import { getBillingStatus, getPaymentStatus } from '../services/billingService.js'
import { subscriptionPlans as plans } from '../data/subscriptionPlans.js'

export default function Pricing() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('url_10')
  const [details, setDetails] = useState({ phone: '', address: '', city: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMessage, setPaymentMessage] = useState('')

  useEffect(() => {
    getBillingStatus().then(setStatus).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    const paymentResult = searchParams.get('payment')
    if (!paymentResult) return undefined

    if (paymentResult === 'cancelled') {
      sessionStorage.removeItem('nilify:payhere-order-id')
      setPaymentMessage('Payment cancelled.')
      setSearchParams({}, { replace: true })
      return undefined
    }

    const orderId = sessionStorage.getItem('nilify:payhere-order-id')
    if (paymentResult !== 'returned' || !orderId) {
      setError('Could not verify the returned payment. Please check your subscription status.')
      setSearchParams({}, { replace: true })
      return undefined
    }

    let active = true
    async function confirmPayment() {
      setLoading(true)
      setPaymentMessage('Confirming payment securely…')
      try {
        for (let attempt = 0; attempt < 15; attempt += 1) {
          const payment = await getPaymentStatus(orderId)
          if (payment.payment_status === 'paid') {
            const refreshedStatus = await getBillingStatus()
            if (!active) return
            setStatus(refreshedStatus)
            setPaymentMessage('Payment successful. Your subscription is now active.')
            sessionStorage.removeItem('nilify:payhere-order-id')
            setSearchParams({}, { replace: true })
            return
          }
          if (['failed', 'cancelled', 'chargedback'].includes(payment.payment_status)) {
            throw new Error(
              payment.payment_status === 'cancelled' ? 'Payment cancelled.' : 'Payment failed.',
            )
          }
          await new Promise((resolve) => window.setTimeout(resolve, 2000))
        }
        throw new Error('Payment is still being confirmed. Please refresh this page shortly.')
      } catch (confirmError) {
        if (active) {
          setPaymentMessage('')
          setError(confirmError.message || 'Could not confirm payment.')
          setSearchParams({}, { replace: true })
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    confirmPayment()
    return () => { active = false }
  }, [searchParams, setSearchParams])

  function handleCheckout(event) {
    event.preventDefault()
    setError('')
    setPaymentMessage('')
    sessionStorage.setItem(
      'nilify:checkout',
      JSON.stringify({ plan: selectedPlan, ...details }),
    )
    navigate('/checkout')
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl font-bold">Choose your tracking plan</h1>
        <p className="text-muted mt-2">Your first 3 product tracking uses are free.</p>
        <p className="text-muted text-sm mt-1">Select a subscription plan, then enter your billing details below.</p>
        {status && (
          <p className="text-sm mt-2 text-mint">
            {status.subscription_status === 'active'
              ? `${status.subscription_plan} subscription active`
              : `${status.free_remaining} free tracking use(s) remaining`}
          </p>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {plans.map((plan) => (
          <button
            type="button"
            key={plan.id}
            onClick={() => setSelectedPlan(plan.id)}
            className={`text-left rounded-2xl border p-6 transition-colors focus-ring ${
              selectedPlan === plan.id
                ? 'border-gold bg-night-surface-2 shadow-sm'
                : 'border-ink/10 bg-night-surface hover:border-gold/50'
            }`}
          >
            {plan.featured && <span className="text-xs text-mint font-semibold">POPULAR</span>}
            <h2 className="font-display text-xl font-bold mt-1">{plan.name}</h2>
            <p className="font-display text-3xl font-bold mt-4">Rs. {plan.price.toLocaleString()}</p>
            <p className="text-muted text-sm">for {plan.duration}, automatically renewed</p>
            <p className="flex items-center gap-2 text-sm mt-5"><Check size={15} /> Track up to {plan.urls} URL{plan.urls > 1 ? 's' : ''}</p>
            <p className="flex items-center gap-2 text-sm mt-2"><Check size={15} /> Price and stock notifications</p>
            <p className="flex items-center gap-2 text-sm mt-2"><Check size={15} /> Gemini buy-or-wait advice</p>
            <span className={`inline-flex mt-5 text-sm font-semibold ${
              selectedPlan === plan.id ? 'text-mint' : 'text-gold'
            }`}>
              {selectedPlan === plan.id ? '✓ Selected plan' : 'Choose this plan →'}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={handleCheckout} className="max-w-lg mx-auto bg-night-surface border border-ink/10 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-xl font-bold">Billing details</h2>
          <p className="text-muted text-sm mt-1">Enter your billing address, then continue to choose your payment method.</p>
        </div>
        {['phone', 'address', 'city'].map((field) => (
          <div key={field}>
            <label htmlFor={field} className="block text-sm text-muted mb-1.5 capitalize">{field}</label>
            <input
              id={field}
              required
              value={details[field]}
              onChange={(event) => setDetails({ ...details, [field]: event.target.value })}
              className="w-full bg-white border border-ink/15 rounded-lg px-4 py-2.5 focus-ring outline-none"
            />
          </div>
        ))}
        {error && <p className="text-coral text-sm">{error}</p>}
        {paymentMessage && <p className="text-mint text-sm">{paymentMessage}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gold text-night font-semibold py-3 rounded-full hover:bg-gold-soft focus-ring disabled:opacity-60"
        >
          <CreditCard size={17} /> Continue
        </button>
      </form>
    </div>
  )
}
