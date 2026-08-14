import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Plus } from 'lucide-react'
import { useAuth } from '../context/authContext.js'
import { getUnreadNotifications } from '../services/notificationService.js'

export default function Navbar() {
  const { user, loading, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)

  const loadUnreadCount = useCallback(async () => {
    if (!user || user.role !== 'user') {
      setUnreadCount(0)
      return
    }
    try {
      const notifications = await getUnreadNotifications({ limit: 100 })
      setUnreadCount(notifications.length)
    } catch {
      setUnreadCount(0)
    }
  }, [user])

  useEffect(() => {
    loadUnreadCount()
  }, [loadUnreadCount, location.pathname])

  useEffect(() => {
    window.addEventListener('notifications:changed', loadUnreadCount)
    const refreshTimer = window.setInterval(loadUnreadCount, 3000)
    return () => {
      window.removeEventListener('notifications:changed', loadUnreadCount)
      window.clearInterval(refreshTimer)
    }
  }, [loadUnreadCount])

  return (
    <header className="border-b border-ink/10 bg-night/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 focus-ring rounded">
          <span className="w-8 h-8 rounded-full bg-gold flex items-center justify-center">
            <Bell size={16} className="text-night" strokeWidth={2.5} />
          </span>
          <span className="font-display font-bold text-xl tracking-tight">Nilify</span>
        </Link>

        <nav className="flex items-center gap-3">
          {loading ? null : user?.role === 'admin' ? (
            <>
              <Link
                to="/admin/dashboard"
                className="text-sm text-muted hover:text-ink transition-colors focus-ring rounded px-2 py-1"
              >
                Admin dashboard
              </Link>
              <span className="hidden sm:inline-flex text-xs font-semibold uppercase tracking-wider text-mint bg-night-surface-2 px-3 py-1.5 rounded-full">
                Admin
              </span>
              <button
                onClick={async () => {
                  await logout()
                  navigate('/')
                }}
                className="text-sm text-muted hover:text-ink transition-colors focus-ring rounded px-2 py-1"
              >
                Log out
              </button>
            </>
          ) : user ? (
            <>
              <Link
                to="/dashboard"
                className="text-sm text-muted hover:text-ink transition-colors focus-ring rounded px-2 py-1"
              >
                Dashboard
              </Link>
              <Link
                to="/pricing"
                className="text-sm text-muted hover:text-ink transition-colors focus-ring rounded px-2 py-1"
              >
                Plans
              </Link>
              <Link
                to="/add-product"
                className="flex items-center gap-1.5 bg-gold text-night text-sm font-semibold px-4 py-2 rounded-full hover:bg-gold-soft transition-colors focus-ring"
              >
                <Plus size={16} strokeWidth={2.5} />
                Track a product
              </Link>
              <Link
                to="/notifications"
                aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
                className="relative inline-flex items-center gap-1.5 h-9 px-3 text-sm text-muted hover:text-ink bg-night-surface border border-ink/10 rounded-full transition-colors focus-ring"
              >
                <Bell size={17} />
                <span className="hidden sm:inline">Notifications</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-coral text-white text-[10px] font-semibold flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <button
                onClick={async () => {
                  await logout()
                  navigate('/')
                }}
                className="text-sm text-muted hover:text-ink transition-colors focus-ring rounded px-2 py-1"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-muted hover:text-ink transition-colors focus-ring rounded px-2 py-1"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="bg-gold text-night text-sm font-semibold px-4 py-2 rounded-full hover:bg-gold-soft transition-colors focus-ring"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
