import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { languageOptions, type Language, usePreferences } from '@/lib/preferences'
import { authFetch, getStoredUserId, hasStoredSession } from '@/lib/auth'
import { buildBackendUrl } from '@/lib/utils'
import { Bell } from 'lucide-react'

type HeaderUserProfile = {
  is_admin?: boolean
  is_superuser?: boolean
}

type Notification = {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
}

const Header = () => {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [user, setUser] = React.useState<HeaderUserProfile | null>(null)
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)
  const { language, setLanguage } = usePreferences()
  const { t } = useTranslation()

  React.useEffect(() => {
    if (!hasStoredSession()) return

    const userId = getStoredUserId()
    if (!userId) return

    let isCurrent = true

    const loadUser = async () => {
      try {
        const response = await authFetch(buildBackendUrl(`/api/user/${userId}/`))
        if (!response.ok) return
        const profile = (await response.json()) as HeaderUserProfile
        if (isCurrent) setUser(profile)
      } catch {
        if (isCurrent) setUser(null)
      }
    }

    void loadUser()

    return () => {
      isCurrent = false
    }
  }, [])

  React.useEffect(() => {
    if (!hasStoredSession()) return

    let isCurrent = true
    const loadNotifications = async () => {
      try {
        const response = await authFetch(buildBackendUrl('/api/notifications/'))
        if (!response.ok) return
        const data = await response.json() as { results: Notification[]; unread_count: number }
        if (isCurrent) {
          setNotifications(data.results)
          setUnreadCount(data.unread_count)
        }
      } catch {
        // Notifications are auxiliary and must not interrupt navigation.
      }
    }

    void loadNotifications()
    const interval = window.setInterval(() => void loadNotifications(), 30000)
    return () => {
      isCurrent = false
      window.clearInterval(interval)
    }
  }, [])

  const markNotificationAsRead = async (notification: Notification) => {
    if (notification.read) return
    try {
      const response = await authFetch(buildBackendUrl(`/api/notifications/${notification.id}/read/`), { method: 'PATCH' })
      if (!response.ok) return
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read: true } : item))
      setUnreadCount((current) => Math.max(0, current - 1))
    } catch {
      // Keep the notification unread when the request fails.
    }
  }

  const canManageMentorApplications = Boolean(user?.is_admin || user?.is_superuser)
  const navItems = [
    { label: t('nav.pymes'), to: '/pymes' },
    { label: t('nav.learning'), to: '/aprendizaje' },
    { label: t('nav.tools'), to: '/herramientas' },
    { label: t('nav.dashboard'), to: '/dashboard' },
    { label: 'Asistente', to: '/chatbot' },
    { label: t('nav.blog'), to: '/blog' },
    ...(canManageMentorApplications ? [{ label: t('nav.admin'), to: '/admin/solicitudes-mentor' }] : []),
    { label: t('nav.settings'), to: '/settings' },
  ]

  return (
    <nav className="relative flex items-center justify-between border-b border-border/70 bg-background/90 px-6 py-4 font-sans text-foreground backdrop-blur md:px-12 lg:px-24 xl:px-40 z-10000">
      <Link to="/" className="shrink-0 text-primary transition-opacity hover:opacity-90" aria-label="Mentras home">
       <p className='text-5xl'>Mentras</p>
      </Link>

      <div className="hidden items-center gap-2 rounded-full border border-border bg-card/80 px-1 py-1 shadow-sm md:flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `rounded-full px-4 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'border border-primary/15 bg-primary/10 font-medium text-primary hover:text-primary/80'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="relative">
          <button
            type="button"
            aria-label="Notificaciones"
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative rounded-full border border-border bg-card p-2 text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">{unreadCount > 99 ? '99+' : unreadCount}</span>}
          </button>
          {notificationsOpen && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">Notificaciones</p>
                {unreadCount > 0 && <button type="button" className="text-xs text-primary" onClick={async () => { await authFetch(buildBackendUrl('/api/notifications/read-all/'), { method: 'PATCH' }); setNotifications((current) => current.map((item) => ({ ...item, read: true }))); setUnreadCount(0) }}>Marcar todas</button>}
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {notifications.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No tienes notificaciones.</p> : notifications.map((notification) => (
                  <button key={notification.id} type="button" onClick={() => void markNotificationAsRead(notification)} className={`w-full rounded-lg p-2 text-left text-sm ${notification.read ? 'bg-muted/40' : 'bg-primary/10'}`}>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-muted-foreground">{notification.message}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <label className="sr-only" htmlFor="site-language">{t('nav.language')}</label>
        <select
          id="site-language"
          value={language}
          className="rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground outline-none transition hover:border-primary/35"
          onChange={(event) => setLanguage(event.target.value as Language)}
        >
          {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.flag} {option.shortLabel}</option>)}
        </select>
        <Link
          to="/profile"
          className="inline-flex items-center gap-2.5 rounded-full border-0 bg-linear-to-r from-accent to-primary py-2 pl-5 pr-2 text-sm font-medium text-primary-foreground shadow-lg shadow-accent/20 transition-[background-image,background-color,box-shadow] duration-300 ease-out hover:bg-accent hover:bg-none hover:shadow-accent/30"
        >
          {t('nav.profile')}
          <span className="flex size-7 items-center justify-center rounded-full bg-white">
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M.6 4.602h10m-4-4 4 4-4 4" stroke="#3f3f47" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </Link>
      </div>

      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex flex-col gap-1.5 border-0 bg-transparent p-1 md:hidden"
      >
        <span className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
        <span className={`block h-0.5 w-6 bg-foreground transition-opacity ${menuOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block h-0.5 w-6 bg-foreground transition-transform ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
      </button>

      {menuOpen && (
        <div className="absolute left-0 top-full z-50 flex w-full flex-col gap-1 border-t border-border bg-background/95 p-5 md:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2.5 text-sm ${
                  isActive
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <select
            aria-label={t('nav.language')}
            value={language}
            className="mt-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground outline-none"
            onChange={(event) => setLanguage(event.target.value as Language)}
          >
            {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.flag} {option.shortLabel}</option>)}
          </select>
          <Link
            to="/profile"
            onClick={() => setMenuOpen(false)}
            className="mt-3 flex w-fit items-center justify-center gap-2.5 rounded-full bg-linear-to-r from-accent to-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-lg shadow-accent/20 transition-[background-image,background-color,box-shadow] duration-300 ease-out hover:bg-accent hover:bg-none hover:shadow-accent/30"
          >
            {t('nav.profile')}
            <span className="flex size-7 items-center justify-center rounded-full bg-white">
              <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M.6 4.602h10m-4-4 4 4-4 4" stroke="#3f3f47" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Header
