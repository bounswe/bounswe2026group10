import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import googleLogo from '@/assets/logo-google.svg'
import appleLogo from '@/assets/logo-apple.svg'
import heroImg from '@/assets/welcome-hero.png'
import { useAppSelector } from '@/store/hooks'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import './WelcomePage.css'

export function WelcomePage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  return (
    <div className="welcome" id="welcome-page">
      <div className="welcome__lang">
        <LanguageSwitcher variant="compact" />
      </div>

      {/* Background hero image */}
      <div className="welcome__hero">
        <img
          src={heroImg}
          alt={t('welcome.heroAlt')}
          className="welcome__hero-img"
        />
        <div className="welcome__hero-overlay" />
      </div>

      {/* Content */}
      <div className="welcome__content">
        {/* Branding */}
        <header className="welcome__brand">
          <span className="welcome__app-name">Roots &amp; Recipes</span>
          <h1 className="welcome__headline">
            {t('welcome.headlineBefore')}{' '}
            <em className="welcome__headline-accent">{t('welcome.headlineAccent')}</em>{' '}
            {t('welcome.headlineAfter')}
          </h1>
          <p className="welcome__tagline">{t('welcome.tagline')}</p>
          <div className="welcome__divider" />
        </header>

        {/* Primary actions */}
        <div className="welcome__actions">
          <Link to="/register" className="welcome__btn welcome__btn--primary" id="welcome-create-account">
            <span>{t('welcome.createAccount')}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <Link to="/login" className="welcome__btn welcome__btn--secondary" id="welcome-sign-in">
            <span>{t('welcome.signIn')}</span>
          </Link>
        </div>

        {/* Divider */}
        <div className="welcome__or-divider">
          <span>{t('welcome.orContinue')}</span>
        </div>

        {/* Social auth */}
        <div className="welcome__social">
          <button className="welcome__social-btn welcome__social-btn--google" id="welcome-google-auth" type="button">
            <img src={googleLogo} alt="" width="20" height="20" />
            <span>{t('welcome.continueGoogle')}</span>
          </button>
          <button className="welcome__social-btn welcome__social-btn--apple" id="welcome-apple-auth" type="button">
            <img src={appleLogo} alt="" width="20" height="20" />
            <span>{t('welcome.continueApple')}</span>
          </button>
        </div>

        {/* Guest link */}
        <Link to="/home" className="welcome__guest-link" id="welcome-guest">
          {t('welcome.continueGuest')}
        </Link>
      </div>
    </div>
  )
}
