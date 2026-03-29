import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserRole } from '@/hooks/useUserRole'
import './NavBar.css'

export function NavBar() {
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

      {/* Nav link list — horizontal on wide, dropdown on narrow */}
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

        {canCreate && (
          <li>
            <NavLink to="/create-recipe" className={linkClass} onClick={close}>
              {t('nav.createRecipe')}
            </NavLink>
          </li>
        )}

        <li>
          <NavLink to="/profile" className={linkClass} onClick={close}>
            {t('nav.profile')}
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
