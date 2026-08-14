import { useState } from 'react'
import { Trash2, ExternalLink, TrendingDown, Sparkles } from 'lucide-react'
import { formatPrice } from '../utils/formatters.js'
import { getAiProductAdvice } from '../services/productService.js'

export default function ProductCard({ product, onDelete }) {
  const [advice, setAdvice] = useState(null)
  const [adviceError, setAdviceError] = useState('')
  const [adviceLoading, setAdviceLoading] = useState(false)
  const {
    name,
    image_url,
    current_price,
    target_price,
    store_name,
    url,
    in_stock = true,
    currency = 'LKR',
    tracking_error,
  } = product

  const hasCurrentPrice = current_price !== null && current_price !== undefined && current_price !== ''
  const hasTargetPrice = target_price !== null && target_price !== undefined && target_price !== ''
  const isBelowTarget = hasCurrentPrice && hasTargetPrice && Number(current_price) <= Number(target_price)

  async function handleAdvice() {
    setAdviceError('')
    setAdviceLoading(true)
    try {
      setAdvice(await getAiProductAdvice(product.id))
    } catch (error) {
      const message = error.message?.includes('timeout')
        ? 'Gemini is taking too long. Please try again.'
        : error.message
      setAdviceError(message || 'Could not generate AI advice.')
    } finally {
      setAdviceLoading(false)
    }
  }

  return (
    <div className="price-tag bg-night-surface border border-ink/10 shadow-sm flex gap-4 p-4 pr-5">
      <img
        src={image_url || 'https://placehold.co/96x96/262550/9C9AC0?text=No+Image'}
        alt={name}
        className="w-20 h-20 rounded-lg object-cover flex-shrink-0 bg-night-surface-2"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted mb-0.5">{store_name}</p>
            <h3 className="font-medium truncate pr-2">{name}</h3>
          </div>
          <button
            onClick={() => onDelete?.(product.id)}
            aria-label="Stop tracking this product"
            className="text-muted hover:text-coral transition-colors focus-ring rounded flex-shrink-0"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <span className="font-display font-bold text-lg">
            {hasCurrentPrice ? formatPrice(current_price, currency) : 'Price pending'}
          </span>
          {hasTargetPrice && (
            <span className="text-xs text-muted">target {formatPrice(target_price, currency)}</span>
          )}
          {isBelowTarget && (
            <span className="flex items-center gap-1 text-xs font-medium text-mint bg-mint/10 px-2 py-0.5 rounded-full">
              <TrendingDown size={12} /> Below target
            </span>
          )}
          {in_stock === false && (
            <span className="text-xs font-medium text-coral bg-coral/10 px-2 py-0.5 rounded-full">
              Out of stock
            </span>
          )}
        </div>

        {tracking_error && (
          <p className="text-xs text-coral mt-2" title={tracking_error}>
            Tracking issue: {tracking_error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 mt-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-soft focus-ring rounded"
          >
            View product <ExternalLink size={12} />
          </a>
          <button
            type="button"
            onClick={handleAdvice}
            disabled={adviceLoading}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink hover:text-gold disabled:opacity-60 focus-ring rounded"
          >
            <Sparkles size={12} /> {adviceLoading ? 'Thinking…' : 'Buy or wait?'}
          </button>
        </div>

        {adviceError && <p className="text-xs text-coral mt-2">{adviceError}</p>}
        {advice && (
          <div className="mt-3 rounded-lg bg-night-surface-2 p-3 text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold capitalize text-mint">{advice.recommendation}</span>
              <span className="text-muted">{advice.confidence} confidence</span>
            </div>
            <p className="text-ink">{advice.summary}</p>
            <ul className="list-disc pl-4 mt-1 text-muted space-y-0.5">
              {advice.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
            <p className="text-muted mt-2 italic">{advice.disclaimer}</p>
          </div>
        )}
      </div>
    </div>
  )
}
