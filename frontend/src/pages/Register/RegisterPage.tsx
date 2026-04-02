import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import googleLogo from '@/assets/logo-google.svg'
import appleLogo from '@/assets/logo-apple.svg'
import { session } from '@/auth/session'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { registerAsync, clearError, logoutAsync } from '@/store/slices/auth-slice'
import { fetchProfileAsync } from '@/store/slices/profile-slice'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import './RegisterPage.css'

type UserRole = 'learner' | 'cook' | 'expert'

interface FormState {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole | ''
  region: string
  language: string
}

interface FieldErrors {
  firstName?: string
  lastName?: string
  email?: string
  password?: string
  confirmPassword?: string
  role?: string
  region?: string
}

const REGIONS = ['Turkey', 'Greece', 'Italy', 'Mexico', 'India', 'Japan']
const LANGUAGES = ['English', 'Türkçe']

const PW_STRENGTH_KEYS = ['weak', 'fair', 'good', 'strong'] as const

function getPasswordStrengthLevel(pw: string): number {
  if (pw.length === 0) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

function validateRegister(t: TFunction<'common'>, form: FormState): FieldErrors {
  const e: FieldErrors = {}
  if (!form.firstName.trim()) e.firstName = t('auth.register.errors.firstNameRequired')
  if (!form.lastName.trim()) e.lastName = t('auth.register.errors.lastNameRequired')
  if (!form.email.trim()) e.email = t('auth.register.errors.emailRequired')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    e.email = t('auth.register.errors.emailInvalid')
  if (!form.password) e.password = t('auth.register.errors.passwordRequired')
  else if (form.password.length < 8)
    e.password = t('auth.register.errors.passwordMin')
  if (form.password !== form.confirmPassword)
    e.confirmPassword = t('auth.register.errors.confirmMismatch')
  if (!form.role) e.role = t('auth.register.errors.roleRequired')
  return e
}

export function RegisterPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const dispatch = useAppDispatch()

  const { loading, error: serverError } = useAppSelector((state) => state.auth)

  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    region: REGIONS[0],
    language: LANGUAGES[0],
  })
  const [errors, setErrors] = useState<FieldErrors>({})

  const pwLevel = getPasswordStrengthLevel(form.password)
  const pwLabelKey =
    pwLevel > 0 ? PW_STRENGTH_KEYS[Math.min(Math.max(pwLevel, 1), 4) - 1] : PW_STRENGTH_KEYS[0]

  useEffect(() => {
    if (session.getTokens().accessToken) {
      void dispatch(logoutAsync())
    }
    dispatch(clearError())
  }, [dispatch])

  useEffect(() => {
    return () => {
      dispatch(clearError())
    }
  }, [dispatch])

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field as keyof FieldErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    if (serverError) dispatch(clearError())
  }

  function validate(): boolean {
    const e = validateRegister(t, form)
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return

    const username = `${form.firstName.trim().toLowerCase()}_${form.lastName.trim().toLowerCase()}`
    try {
      await dispatch(
        registerAsync({
          email: form.email.trim(),
          password: form.password,
          username,
          role: form.role,
        })
      ).unwrap()
      await dispatch(fetchProfileAsync()).unwrap()
      navigate('/home', { replace: true })
    } catch {
      // Error message is already in Redux state
    }
  }

  return (
    <div className="register" id="register-page">
      <header className="register__header">
        <Link to="/" className="register__back" aria-label={t('auth.register.backAria')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="register__header-title">{t('auth.register.brand')}</span>
        <div className="register__lang">
          <LanguageSwitcher variant="compact" />
        </div>
      </header>

      <form className="register__form" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="register__alert" role="alert" id="register-server-error">
            {serverError}
          </div>
        )}

        <div className="register__field">
          <label className="register__label" htmlFor="reg-first-name">
            {t('auth.register.firstName')}
          </label>
          <input
            className={`register__input ${errors.firstName ? 'register__input--error' : ''}`}
            id="reg-first-name"
            type="text"
            placeholder={t('auth.register.firstNamePlaceholder')}
            value={form.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            autoComplete="given-name"
          />
          {errors.firstName && <span className="register__error">{errors.firstName}</span>}
        </div>

        <div className="register__field">
          <label className="register__label" htmlFor="reg-last-name">
            {t('auth.register.lastName')}
          </label>
          <input
            className={`register__input ${errors.lastName ? 'register__input--error' : ''}`}
            id="reg-last-name"
            type="text"
            placeholder={t('auth.register.lastNamePlaceholder')}
            value={form.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            autoComplete="family-name"
          />
          {errors.lastName && <span className="register__error">{errors.lastName}</span>}
        </div>

        <div className="register__field">
          <label className="register__label" htmlFor="reg-email">
            {t('auth.register.email')}
          </label>
          <input
            className={`register__input ${errors.email ? 'register__input--error' : ''}`}
            id="reg-email"
            type="email"
            placeholder={t('auth.register.emailPlaceholder')}
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            autoComplete="email"
          />
          {errors.email && <span className="register__error">{errors.email}</span>}
        </div>

        <div className="register__field">
          <label className="register__label" htmlFor="reg-password">
            {t('auth.register.password')}
          </label>
          <input
            className={`register__input ${errors.password ? 'register__input--error' : ''}`}
            id="reg-password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            autoComplete="new-password"
          />
          {form.password && (
            <div className="register__pw-strength">
              <div className="register__pw-bar">
                <div
                  className={`register__pw-fill register__pw-fill--${pwLevel}`}
                  style={{ width: `${(pwLevel / 4) * 100}%` }}
                />
              </div>
              <span className={`register__pw-label register__pw-label--${pwLevel}`}>
                {t(`auth.register.pwStrength.${pwLabelKey}`)}
              </span>
            </div>
          )}
          {errors.password && <span className="register__error">{errors.password}</span>}
        </div>

        <div className="register__field">
          <label className="register__label" htmlFor="reg-confirm-password">
            {t('auth.register.confirmPassword')}
          </label>
          <input
            className={`register__input ${errors.confirmPassword ? 'register__input--error' : ''}`}
            id="reg-confirm-password"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <span className="register__error">{errors.confirmPassword}</span>
          )}
        </div>

        <fieldset className="register__roles" id="reg-role-selection">
          <legend className="register__roles-legend">{t('auth.register.rolesLegend')}</legend>
          {errors.role && <span className="register__error">{errors.role}</span>}

          <label
            className={`register__role-card ${form.role === 'learner' ? 'register__role-card--active' : ''}`}
            htmlFor="role-learner"
          >
            <input
              type="radio"
              id="role-learner"
              name="role"
              value="learner"
              checked={form.role === 'learner'}
              onChange={(e) => handleChange('role', e.target.value)}
              className="sr-only"
            />
            <span className="register__role-icon">📖</span>
            <div className="register__role-info">
              <span className="register__role-name">{t('auth.register.roleLearner')}</span>
              <span className="register__role-desc">{t('auth.register.roleLearnerDesc')}</span>
            </div>
          </label>

          <label
            className={`register__role-card ${form.role === 'cook' ? 'register__role-card--active' : ''}`}
            htmlFor="role-cook"
          >
            <input
              type="radio"
              id="role-cook"
              name="role"
              value="cook"
              checked={form.role === 'cook'}
              onChange={(e) => handleChange('role', e.target.value)}
              className="sr-only"
            />
            <span className="register__role-icon">🍳</span>
            <div className="register__role-info">
              <span className="register__role-name">{t('auth.register.roleCook')}</span>
              <span className="register__role-desc">{t('auth.register.roleCookDesc')}</span>
            </div>
          </label>

          <label
            className={`register__role-card ${form.role === 'expert' ? 'register__role-card--active' : ''}`}
            htmlFor="role-expert"
          >
            <input
              type="radio"
              id="role-expert"
              name="role"
              value="expert"
              checked={form.role === 'expert'}
              onChange={(e) => handleChange('role', e.target.value)}
              className="sr-only"
            />
            <span className="register__role-icon">🌿</span>
            <div className="register__role-info">
              <span className="register__role-name">{t('auth.register.roleExpert')}</span>
              <span className="register__role-desc">{t('auth.register.roleExpertDesc')}</span>
            </div>
          </label>
        </fieldset>

        <div className="register__field">
          <label className="register__label" htmlFor="reg-region">
            {t('auth.register.region')}
          </label>
          <div className="register__select-wrap">
            <select
              className="register__select"
              id="reg-region"
              value={form.region}
              onChange={(e) => handleChange('region', e.target.value)}
            >
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <svg className="register__select-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <div className="register__field">
          <label className="register__label" htmlFor="reg-language">
            {t('auth.register.profileLanguage')}
          </label>
          <div className="register__select-wrap">
            <select
              className="register__select"
              id="reg-language"
              value={form.language}
              onChange={(e) => handleChange('language', e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
            <svg className="register__select-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        <button
          type="submit"
          className="register__submit"
          id="reg-submit"
          disabled={loading}
        >
          {loading ? (
            <span className="register__spinner" />
          ) : (
            t('auth.register.submit')
          )}
        </button>

        <div className="register__or-divider">
          <span>{t('auth.register.orConnect')}</span>
        </div>

        <div className="register__social">
          <button className="register__social-btn" id="reg-google-auth" type="button">
            <img src={googleLogo} alt="" width="18" height="18" />
            <span>{t('auth.register.google')}</span>
          </button>
          <button className="register__social-btn register__social-btn--apple" id="reg-apple-auth" type="button">
            <img src={appleLogo} alt="" width="18" height="18" />
            <span>{t('auth.register.apple')}</span>
          </button>
        </div>

        <p className="register__footer">
          {t('auth.register.footerHasAccount')}{' '}
          <Link to="/login" className="register__footer-link" id="reg-go-login">
            {t('auth.register.signIn')}
          </Link>
        </p>
      </form>
    </div>
  )
}
