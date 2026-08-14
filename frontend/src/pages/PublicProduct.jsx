import { ArrowLeft, CheckCircle2, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicProduct } from '../services/adminService.js'

export default function PublicProduct() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => { getPublicProduct(id).then(setProduct).catch((requestError) => setError(requestError.message)) }, [id])

  if (!product) return <div className="mx-auto max-w-6xl px-6 py-16 text-muted">{error || 'Loading product…'}</div>

  async function copyUrl() {
    await navigator.clipboard.writeText(window.location.href)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-16">
      <Link to="/admin/products" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-[#34A853] hover:text-[#1F4D36]">
        <ArrowLeft size={17} /> Back to products
      </Link>
      <article className="grid overflow-hidden rounded-3xl border border-[#1F4D36]/10 bg-white shadow-xl shadow-[#1F4D36]/5 md:grid-cols-2">
        <div className="bg-[#F4FBF5] p-5 sm:p-9">
          <img src={product.image_url} alt={product.name} className="aspect-square h-full w-full rounded-2xl object-cover" data-product-image />
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#34A853]">{product.category}</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-[#1F4D36] sm:text-4xl" data-product-name>{product.name}</h1>
          <p className="mt-5 leading-7 text-muted">{product.description}</p>
          <p className="mt-7 font-display text-3xl font-bold text-[#1F4D36]" data-product-price={product.price}>Rs. {product.price.toLocaleString()}</p>
          <div className="mt-7 grid gap-4 rounded-2xl bg-[#F4FBF5] p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted">Availability</p>
              <p className="mt-1 flex items-center gap-2 font-semibold text-[#1F4D36]" data-stock-status={product.in_stock ? 'in_stock' : 'out_of_stock'}><CheckCircle2 size={17} className="text-[#34A853]" /> {product.in_stock ? `In stock (${product.stock_quantity})` : 'Out of stock'}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Colour</p>
              <p className="mt-1 font-semibold text-[#1F4D36]" data-product-colour={product.colour}>{product.colour}</p>
            </div>
          </div>
          <button type="button" onClick={copyUrl} className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-[#34A853] px-5 py-3 font-semibold text-white hover:bg-[#2f974b] focus-ring">
            <Copy size={18} /> Copy product URL
          </button>
        </div>
      </article>
    </div>
  )
}
