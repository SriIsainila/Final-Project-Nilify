import { Bell, LayoutDashboard, LogOut, Package, X, Menu } from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/authContext.js'

const links = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="admin-shell">
      <header className="admin-mobile-header">
        <span className="admin-brand"><Bell size={18} /> Nilify Admin</span>
        <button type="button" onClick={() => setOpen(!open)} aria-label="Toggle admin navigation" className="focus-ring rounded-lg p-2">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <aside className={`admin-sidebar ${open ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-brand admin-desktop-brand">
          <span className="admin-logo"><Bell size={18} /></span>
          <span>Nilify</span>
        </div>
        <p className="admin-label">Admin workspace</p>
        <nav className="admin-nav" aria-label="Admin navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end onClick={() => setOpen(false)} className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-link-active' : ''}`}>
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={handleLogout} className="admin-logout">
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {open && <button type="button" className="admin-overlay" aria-label="Close navigation" onClick={() => setOpen(false)} />}
      <main className="admin-main"><Outlet /></main>
    </div>
  )
}
