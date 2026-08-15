import { Edit3, Plus, Search, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAdminProduct, getAdminProducts } from '../services/adminService.js'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function removeProduct(product) {
    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) return
    setError('')
    try {
      await deleteAdminProduct(product.id)
      setProducts((current) => current.filter((item) => item.id !== product.id))
    } catch (requestError) { setError(requestError.message) }
  }

  useEffect(() => {
    getAdminProducts().then(setProducts).catch((requestError) => setError(requestError.message)).finally(() => setLoading(false))
  }, [])

  const visibleProducts = useMemo(() => products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase())), [products, query])

  return (
    <div className="admin-page">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div><p className="text-[#34A853] text-xs font-semibold uppercase tracking-[0.16em]">Product management</p><h1 className="font-display text-3xl font-bold text-[#1F4D36] mt-2">Products</h1><p className="text-muted text-sm mt-2">Edit product prices, stock and details.</p></div>
        <Link to="/admin/products/add" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#34A853] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2f974b] focus-ring"><Plus size={18} /> Add Product</Link>
      </div>
      <div className="admin-card mb-6 !p-4"><label className="flex items-center gap-3 rounded-xl border border-[#1F4D36]/15 px-4 py-3"><Search size={18} className="text-muted" /><span className="sr-only">Search products</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="min-w-0 flex-1 bg-transparent text-sm outline-none" /></label></div>
      {loading && <p className="text-sm text-muted">Loading products…</p>}
      {error && <p className="text-sm text-coral">{error}</p>}
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleProducts.map((product) => (
          <article key={product.id} className="admin-card overflow-hidden !p-0">
            <Link to={product.product_url}><img src={product.image_url} alt={product.name} className="aspect-square w-full bg-[#F4FBF5] object-cover" /></Link>
            <div className="p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-[#34A853]">{product.category}</p><h2 className="mt-1 font-display text-lg font-bold text-[#1F4D36]">{product.name}</h2></div><span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${product.in_stock ? 'bg-[#34A853]/10 text-[#1F4D36]' : 'bg-red-50 text-red-600'}`}>{product.in_stock ? 'In stock' : 'Out of stock'}</span></div>
              <p className="mt-4 font-display text-2xl font-bold text-[#1F4D36]">Rs. {Number(product.price).toLocaleString()}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#1F4D36]/10 pt-4 text-sm"><div><p className="text-xs text-muted">Stock</p><p className="mt-1 font-semibold text-[#1F4D36]">{product.stock_quantity} units</p></div><div><p className="text-xs text-muted">Colour</p><p className="mt-1 font-semibold text-[#1F4D36]">{product.colour}</p></div></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><Link to={`/admin/products/edit/${product.id}`} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#34A853] px-4 py-2.5 text-sm font-semibold text-white"><Edit3 size={16} /> Edit</Link><Link to={product.product_url} className="inline-flex items-center justify-center rounded-full border border-[#34A853] px-4 py-2.5 text-sm font-semibold text-[#1F4D36]">View page</Link><button type="button" onClick={() => removeProduct(product)} className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"><Trash2 size={16} /> Delete product</button></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
