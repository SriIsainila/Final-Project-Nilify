import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, CheckCheck, ExternalLink, Trash2 } from 'lucide-react'
import {
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationService.js'

function formatNotificationDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-LK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const unreadCount = notifications.filter((notification) => !notification.is_read).length

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
      setError('')
    }
    try {
      const data = await getNotifications({ unread: unreadOnly, limit: 100 })
      setNotifications(data)
    } catch (loadError) {
      setError(loadError.message || 'Could not load notifications.')
    } finally {
      setLoading(false)
    }
  }, [unreadOnly])

  useEffect(() => {
    loadNotifications()
    const refreshTimer = window.setInterval(() => loadNotifications({ silent: true }), 3000)
    return () => window.clearInterval(refreshTimer)
  }, [loadNotifications])

  async function handleRead(notificationId) {
    setError('')
    try {
      await markNotificationRead(notificationId)
      setNotifications((current) => (
        unreadOnly
          ? current.filter((notification) => notification.id !== notificationId)
          : current.map((notification) => (
            notification.id === notificationId ? { ...notification, is_read: true } : notification
          ))
      ))
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (readError) {
      setError(readError.message || 'Could not mark this notification as read.')
    }
  }

  async function handleReadAll() {
    setError('')
    try {
      await markAllNotificationsRead()
      setNotifications((current) => (
        unreadOnly ? [] : current.map((notification) => ({ ...notification, is_read: true }))
      ))
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (readError) {
      setError(readError.message || 'Could not mark notifications as read.')
    }
  }

  async function handleDelete(notificationId) {
    setError('')
    try {
      await deleteNotification(notificationId)
      setNotifications((current) => current.filter((notification) => notification.id !== notificationId))
      window.dispatchEvent(new Event('notifications:changed'))
    } catch (deleteError) {
      setError(deleteError.message || 'Could not delete this notification.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold">Notifications</h1>
          <p className="text-muted text-sm mt-1">
            URL changes and 12-hour no-change updates appear here while tracking is active.
          </p>
        </div>
        <button
          type="button"
          onClick={handleReadAll}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gold hover:text-gold-soft disabled:text-muted disabled:opacity-60 focus-ring rounded"
        >
          <CheckCheck size={16} /> Mark all as read
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5" role="group" aria-label="Notification filter">
        {[
          { label: 'All', value: false },
          { label: 'Unread', value: true },
        ].map((filter) => (
          <button
            type="button"
            key={filter.label}
            onClick={() => setUnreadOnly(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors focus-ring ${
              unreadOnly === filter.value
                ? 'bg-gold text-night'
                : 'bg-night-surface border border-ink/10 text-muted hover:text-ink'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && <p className="text-coral text-sm mb-4">{error}</p>}

      {loading ? (
        <p className="text-muted text-sm">Loading notifications…</p>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-ink/20 rounded-2xl bg-white/50">
          <Bell size={28} className="mx-auto text-muted mb-3" />
          <p className="font-medium">{unreadOnly ? 'No unread notifications' : 'No changes detected'}</p>
          <p className="text-muted text-sm mt-1">
            {unreadOnly
              ? 'You have read all detected changes.'
              : 'No changes have been detected on your tracked URLs.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`rounded-2xl border p-4 flex gap-4 ${
                notification.is_read
                  ? 'bg-night-surface border-ink/10'
                  : 'bg-night-surface-2 border-gold/30'
              }`}
            >
              <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                notification.is_read ? 'bg-ink/15' : 'bg-gold'
              }`} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-medium truncate">
                    {notification.item_title || 'Tracked product update'}
                  </p>
                  {notification.change_type && (
                    <span className="text-xs capitalize text-mint bg-mint/10 rounded-full px-2 py-0.5">
                      {notification.change_type}
                    </span>
                  )}
                </div>
                <p className="text-sm text-ink">{notification.message}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <p className="text-xs text-muted">{formatNotificationDate(notification.created_at)}</p>
                  {notification.item_url && (
                    <a
                      href={notification.item_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold-soft focus-ring rounded"
                    >
                      View tracked URL <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2 flex-shrink-0">
                {!notification.is_read && (
                  <button
                    type="button"
                    onClick={() => handleRead(notification.id)}
                    aria-label="Mark notification as read"
                    title="Mark as read"
                    className="text-muted hover:text-mint focus-ring rounded"
                  >
                    <Check size={17} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(notification.id)}
                  aria-label="Delete notification"
                  title="Delete"
                  className="text-muted hover:text-coral focus-ring rounded"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
