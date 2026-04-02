import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import googleLogo from '@/assets/logo-google.svg'
import appleLogo from '@/assets/logo-apple.svg'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginAsync, clearError } from '@/store/slices/auth-slice'
import { fetchProfileAsync } from '@/store/slices/profile-slice'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import './LoginPage.css'

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

function validateLogin(t: TFunction<'common'>, form: LoginForm): { email?: string; password?: string } {
  const e: { email?: string; password?: string } = {}
  if (!form.email.trim()) e.email = t('auth.login.errors.emailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = t('auth.login.errors.emailInvalid')
  if (!form.password) e.password = t('auth.login.errors.passwordRequired')
  return e
}

export function LoginPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { loading, error: serverError, isAuthenticated } = useAppSelector((state) => state.auth)
  const profileStatus = useAppSelector((state) => state.profile.status)

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  useEffect(() => {
    if (isAuthenticated && profileStatus === 'succeeded') {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, profileStatus, navigate])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  function handleChange(field: keyof LoginForm, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as 'email' | 'password']) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (serverError) dispatch(clearError())
  }

  function validate(): boolean {
    const e = validateLogin(t, form)
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return

    try {
      await dispatch(
        loginAsync({
          email: form.email.trim(),
          password: form.password,
        })
      ).unwrap()
      await dispatch(fetchProfileAsync()).unwrap()
      navigate('/home', { replace: true })
    } catch {
      // Errors surface via Redux (`serverError`)
    }
  }

  function handleForgotSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    // TODO: integrate with backend forgot-password endpoint
    setForgotSent(true)
  }

  return (
    <div className="login" id="login-page">
      <header className="login__header">
        <Link to="/" className="login__back" aria-label={t('auth.login.backAria')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="login__header-title">{t('auth.login.brand')}</span>
        <div className="login__lang">
          <LanguageSwitcher variant="compact" />
        </div>
      </header>

      <div className="login__body">
        <div className="login__heading">
          <h1 className="login__title">
            {t('auth.login.title')} <em>{t('auth.login.titleEm')}</em>
          </h1>
          <p className="login__subtitle">{t('auth.login.subtitle')}</p>
        </div>

        <form className="login__form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="login__alert" role="alert" id="login-server-error">
              {serverError}
            </div>
          )}

          <div className="login__field">
            <input
              className={`login__input ${errors.email ? 'login__input--error' : ''}`}
              id="login-email"
              type="email"
              placeholder={t('auth.login.emailPlaceholder')}
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              autoComplete="email"
            />
            {errors.email && <span className="login__error">{errors.email}</span>}
          </div>

          <div className="login__field">
            <div className="login__input-wrap">
              <input
                className={`login__input ${errors.password ? 'login__input--error' : ''}`}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('auth.login.passwordPlaceholder')}
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login__toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                id="login-toggle-password"
              >
                {showPassword ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="login__error">{errors.password}</span>}
            <button
              type="button"
              className="login__forgot-link"
              onClick={() => setShowForgotModal(true)}
              id="login-forgot-password"
            >
              {t('auth.login.forgotPassword')}
            </button>
          </div>

          <label className="login__remember" htmlFor="login-remember">
            <span>{t('auth.login.rememberMe')}</span>
            <div className="login__toggle">
              <input
                type="checkbox"
                id="login-remember"
                checked={form.rememberMe}
                onChange={(e) => handleChange('rememberMe', e.target.checked)}
              />
              <span className="login__toggle-track" />
            </div>
          </label>

          <button
            type="submit"
            className="login__submit"
            id="login-submit"
            disabled={loading}
          >
            {loading ? <span className="login__spinner" /> : t('auth.login.signIn')}
          </button>
        </form>

        <div className="login__or-divider">
          <span>{t('auth.login.orContinue')}</span>
        </div>

        <div className="login__social">
          <button className="login__social-btn login__social-btn--google" id="login-google-auth" type="button">
            <img src={googleLogo} alt="" width="20" height="20" />
            <span>{t('auth.login.continueGoogle')}</span>
          </button>
          <button className="login__social-btn login__social-btn--apple" id="login-apple-auth" type="button">
            <img src={appleLogo} alt="" width="20" height="20" />
            <span>{t('auth.login.continueApple')}</span>
          </button>
        </div>

        <p className="login__footer">
          {t('auth.login.footerNoAccount')}{' '}
          <Link to="/register" className="login__footer-link" id="login-go-register">
            {t('auth.login.register')}
          </Link>
        </p>

        <div className="login__legal">
          <a href="#privacy">{t('auth.login.privacy')}</a>
          <span className="login__legal-dot">•</span>
          <a href="#terms">{t('auth.login.terms')}</a>
        </div>
      </div>

      {showForgotModal && (
        <div className="login__modal-overlay" onClick={() => { setShowForgotModal(false); setForgotSent(false) }}>
          <div className="login__modal" onClick={(e) => e.stopPropagation()} id="forgot-password-modal">
            <button
              className="login__modal-close"
              onClick={() => { setShowForgotModal(false); setForgotSent(false) }}
              aria-label={t('auth.login.modalClose')}
              type="button"
            >
              ✕
            </button>
            <h2 className="login__modal-title">{t('auth.login.modalTitle')}</h2>
            {forgotSent ? (
              <div className="login__modal-success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-positive)" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p>{t('auth.login.modalSuccess')}</p>
                <button
                  className="login__submit"
                  onClick={() => { setShowForgotModal(false); setForgotSent(false) }}
                  type="button"
                >
                  {t('auth.login.modalBackSignIn')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p className="login__modal-desc">
                  {t('auth.login.modalDesc')}
                </p>
                <input
                  className="login__input"
                  type="email"
                  placeholder={t('auth.login.emailPlaceholder')}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  id="forgot-email-input"
                  autoComplete="email"
                />
                <button className="login__submit" type="submit" style={{ marginTop: '1rem' }}>
                  {t('auth.login.modalSendReset')}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
