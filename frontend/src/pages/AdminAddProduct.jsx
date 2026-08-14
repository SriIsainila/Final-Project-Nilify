import { ArrowLeft, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createAdminProduct } from '../services/adminService.js'

const initialForm = { name: '', category: '', description: '', image_url: '/products/', price: '', stock_quantity: '', in_stock: true, colour: '' }
const fields = [
  ['name', 'Product name', 'text'], ['category', 'Category', 'text'], ['price', 'Price (Rs.)', 'number'],
  ['stock_quantity', 'Stock quantity', 'number'], ['colour', 'Colour', 'text'], ['image_url', 'Image URL', 'text'],
]

export default function AdminAddProduct() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      await createAdminProduct({ ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) })
      navigate('/admin/products', { replace: true })
    } catch (requestError) { setError(requestError.message) } finally { setSaving(false) }
  }

  return (
    <div className="admin-page max-w-3xl">
      <Link to="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-[#34A853]"><ArrowLeft size={17} /> Back to products</Link>
      <div className="mt-6 admin-card">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#34A853]">Product management</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#1F4D36]">Add product</h1>
        <p className="mt-2 text-sm text-muted">A stable Nilify product URL will be generated automatically.</p>
        <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
          {fields.map(([key, label, type]) => <label key={key} className="grid gap-2 text-sm text-muted"><span>{label}</span><input required type={type} min={type === 'number' ? 0 : undefined} step={key === 'price' ? '0.01' : undefined} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} className="rounded-xl border border-[#1F4D36]/15 px-4 py-3 text-[#1F4D36] outline-none focus-ring" /></label>)}
          <label className="grid gap-2 text-sm text-muted sm:col-span-2"><span>Description</span><textarea required rows="4" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="rounded-xl border border-[#1F4D36]/15 px-4 py-3 text-[#1F4D36] outline-none focus-ring" /></label>
          <label className="flex items-center gap-3 rounded-xl bg-[#F4FBF5] p-4 font-semibold text-[#1F4D36] sm:col-span-2"><input type="checkbox" checked={form.in_stock} onChange={(event) => setForm({ ...form, in_stock: event.target.checked })} className="h-5 w-5 accent-[#34A853]" /> Product is in stock</label>
          {error && <p className="text-sm text-coral sm:col-span-2">{error}</p>}
          <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#34A853] px-5 py-3 font-semibold text-white disabled:opacity-60 sm:col-span-2"><Plus size={18} /> {saving ? 'Adding…' : 'Add product'}</button>
        </form>
      </div>
    </div>
  )
}
