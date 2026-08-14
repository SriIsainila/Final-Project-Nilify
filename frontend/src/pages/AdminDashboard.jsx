import { useEffect, useState } from 'react'
import { Bell, CreditCard, PackageSearch, Users } from 'lucide-react'
import { getAdminDashboard } from '../services/adminService.js'

const cards = [
  { key: 'total_users', label: 'Registered Users', icon: Users },
  { key: 'active_subscriptions', label: 'Active Subscriptions', icon: CreditCard },
  { key: 'tracked_products', label: 'Tracked Products', icon: PackageSearch },
  { key: 'notifications', label: 'Notifications Created', icon: Bell },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getAdminDashboard().then(setStats).catch((requestError) => {
      setError(requestError.message || 'Could not load admin statistics.')
    })
  }, [])

  return (
    <div className="admin-page max-w-5xl">
      <div className="mb-9">
        <p className="text-[#34A853] text-xs font-semibold uppercase tracking-[0.16em]">Administration</p>
        <h1 className="font-display text-3xl font-bold text-[#1F4D36] mt-2">Welcome Admin</h1>
        <p className="text-muted text-sm mt-2">A secure overview of the Nilify system.</p>
      </div>
      {error && <p className="text-coral text-sm mb-5">{error}</p>}
      {!stats && !error ? <p className="text-muted text-sm">Loading dashboard…</p> : stats ? (
        <div className="grid sm:grid-cols-2 gap-5">
          {cards.map(({ key, label, icon: Icon }) => (
            <section key={key} className="admin-card">
              <div className="w-10 h-10 rounded-xl bg-[#34A853]/10 text-[#34A853] flex items-center justify-center mb-5"><Icon size={20} /></div>
              <p className="text-muted text-sm">{label}</p>
              <p className="font-display text-3xl font-bold text-[#1F4D36] mt-1">{stats[key].toLocaleString()}</p>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  )
}
