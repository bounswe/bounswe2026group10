import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserRole } from '@/hooks/useUserRole'
import './NavBar.css'

interface NavBarProps {
  /** Passed from MainLayout so mobile dropdown can show profile link and logout */
  onLogout: () => void
  isLoggingOut: boolean
}

export function NavBar({ onLogout, isLoggingOut }: NavBarProps) {
  const { t } = useTranslation('common')
  const role = useUserRole()
  const [open, setOpen] = useState(false)
  const navRef = useRef<HTMLElement>(null)

  const canCreate = role === 'cook' || role === 'expert'
  const close = () => setOpen(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `app-nav__link${isActive ? ' app-nav__link--active' : ''}`

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // Close on click outside
  useEffect(() => {
    const onOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) close()
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <nav ref={navRef} className="app-nav" aria-label={t('nav.ariaLabel')}>
      {/* Hamburger — visible on narrow screens only */}
      <button
        type="button"
        className="app-nav__toggle"
        aria-expanded={open}
        aria-controls="app-nav-menu"
        aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="app-nav__bar" aria-hidden />
        <span className="app-nav__bar" aria-hidden />
        <span className="app-nav__bar" aria-hidden />
      </button>

      {/*
       * Nav link list:
       *   Desktop — horizontal row (Discovery + Create Recipe)
       *   Mobile dropdown — same links + Profile + logout (user menu hidden on small screens)
       */}
      <ul
        id="app-nav-menu"
        className={`app-nav__list${open ? ' app-nav__list--open' : ''}`}
        role="list"
      >
        <li>
          <NavLink to="/home" className={linkClass} onClick={close}>
            {t('nav.discovery')}
          </NavLink>
        </li>

        <li>
          <NavLink to="/search" className={linkClass} onClick={close}>
            {t('nav.search')}
          </NavLink>
        </li>

        {canCreate && (
          <li>
            <NavLink to="/create-recipe" className={linkClass} onClick={close}>
              {t('nav.createRecipe')}
            </NavLink>
          </li>
        )}

        {/* Profile and logout appear only in mobile dropdown; hidden on desktop via CSS */}
        <li className="app-nav__mobile-only">
          <NavLink to="/profile" className={linkClass} onClick={close}>
            {t('nav.profile')}
          </NavLink>
        </li>

        <li className="app-nav__mobile-only app-nav__mobile-separator">
          <button
            type="button"
            className="app-nav__link app-nav__logout-mobile"
            onClick={() => { close(); onLogout() }}
            disabled={isLoggingOut}
            aria-busy={isLoggingOut}
          >
            {isLoggingOut ? <span className="ui-spinner" aria-hidden /> : t('app.logout')}
          </button>
        </li>
      </ul>
    </nav>
  )
}
