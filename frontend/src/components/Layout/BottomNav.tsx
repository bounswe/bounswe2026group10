import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useUserRole } from '@/hooks/useUserRole'
import './BottomNav.css'

function HomeIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function LibraryIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

export function BottomNav() {
  const { t } = useTranslation('common')
  const { pathname } = useLocation()
  const role = useUserRole()
  const canCreate = role === 'cook' || role === 'expert'

  return (
    <nav className="bottom-nav" aria-label={t('nav.ariaLabel')}>
      <NavLink
        to="/home"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        end
      >
        {() => (
          <>
            <span className="bottom-nav__icon"><HomeIcon /></span>
            <span className="bottom-nav__label">{t('nav.home')}</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/search"
        className={({ isActive }) =>
          `bottom-nav__item${isActive || pathname.startsWith('/dish-variety/') ? ' bottom-nav__item--active' : ''}`
        }
      >
        {() => (
          <>
            <span className="bottom-nav__icon"><SearchIcon /></span>
            <span className="bottom-nav__label">{t('nav.search')}</span>
          </>
        )}
      </NavLink>

      {canCreate ? (
        <NavLink to="/create-recipe" className="bottom-nav__fab" aria-label={t('nav.createRecipe')}>
          <PlusIcon />
        </NavLink>
      ) : (
        <button
          type="button"
          className="bottom-nav__fab bottom-nav__fab--disabled"
          disabled
          aria-disabled
          title={t('nav.createDisabledHint')}
          aria-label={t('nav.createDisabledHint')}
        >
          <PlusIcon />
        </button>
      )}

      <NavLink
        to="/library"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
      >
        {() => (
          <>
            <span className="bottom-nav__icon"><LibraryIcon /></span>
            <span className="bottom-nav__label">{t('nav.library')}</span>
          </>
        )}
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
      >
        {() => (
          <>
            <span className="bottom-nav__icon"><UserIcon /></span>
            <span className="bottom-nav__label">{t('nav.profile')}</span>
          </>
        )}
      </NavLink>
    </nav>
  )
}
