import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import googleLogo from '@/assets/logo-google.svg'
import appleLogo from '@/assets/logo-apple.svg'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { registerAsync, clearError } from '@/store/slices/auth-slice'
import './RegisterPage.css'

type UserRole = 'learner' | 'cook'

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

function getPasswordStrength(pw: string): { level: number; label: string } {
  if (pw.length === 0) return { level: 0, label: '' }
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  return { level: score, label: labels[score - 1] || 'Weak' }
}

export function RegisterPage() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  
  const { loading, error: serverError, isAuthenticated } = useAppSelector((state) => state.auth)

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

  const pwStrength = getPasswordStrength(form.password)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home')
    }
  }, [isAuthenticated, navigate])

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
    const e: FieldErrors = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Please enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
    else if (form.password.length < 8)
      e.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'Passwords do not match.'
    if (!form.role) e.role = 'Please select a role.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return

    const username = `${form.firstName.trim().toLowerCase()}_${form.lastName.trim().toLowerCase()}`
    dispatch(registerAsync({
      email: form.email.trim(),
      password: form.password,
      username,
      role: form.role,
    }))
  }

  return (
    <div className="register" id="register-page">
      {/* Header */}
      <header className="register__header">
        <Link to="/" className="register__back" aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="register__header-title">Roots &amp; Recipes</span>
      </header>

      {/* Form */}
      <form className="register__form" onSubmit={handleSubmit} noValidate>
        {serverError && (
          <div className="register__alert" role="alert" id="register-server-error">
            {serverError}
          </div>
        )}

        {/* Name fields */}
        <div className="register__field">
          <label className="register__label" htmlFor="reg-first-name">
            First Name
          </label>
          <input
            className={`register__input ${errors.firstName ? 'register__input--error' : ''}`}
            id="reg-first-name"
            type="text"
            placeholder="First name"
            value={form.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            autoComplete="given-name"
          />
          {errors.firstName && <span className="register__error">{errors.firstName}</span>}
        </div>

        <div className="register__field">
          <label className="register__label" htmlFor="reg-last-name">
            Last Name
          </label>
          <input
            className={`register__input ${errors.lastName ? 'register__input--error' : ''}`}
            id="reg-last-name"
            type="text"
            placeholder="Last name"
            value={form.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            autoComplete="family-name"
          />
          {errors.lastName && <span className="register__error">{errors.lastName}</span>}
        </div>

        {/* Email */}
        <div className="register__field">
          <label className="register__label" htmlFor="reg-email">
            Email Address
          </label>
          <input
            className={`register__input ${errors.email ? 'register__input--error' : ''}`}
            id="reg-email"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            autoComplete="email"
          />
          {errors.email && <span className="register__error">{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="register__field">
          <label className="register__label" htmlFor="reg-password">
            Password
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
                  className={`register__pw-fill register__pw-fill--${pwStrength.level}`}
                  style={{ width: `${(pwStrength.level / 4) * 100}%` }}
                />
              </div>
              <span className={`register__pw-label register__pw-label--${pwStrength.level}`}>
                {pwStrength.label}
              </span>
            </div>
          )}
          {errors.password && <span className="register__error">{errors.password}</span>}
        </div>

        {/* Confirm Password */}
        <div className="register__field">
          <label className="register__label" htmlFor="reg-confirm-password">
            Confirm Password
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

        {/* Role selection */}
        <fieldset className="register__roles" id="reg-role-selection">
          <legend className="register__roles-legend">Choose Your Role</legend>
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
              <span className="register__role-name">Learner</span>
              <span className="register__role-desc">
                Exploring family traditions and new flavors.
              </span>
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
              <span className="register__role-name">Cook</span>
              <span className="register__role-desc">
                Sharing and preserving daily kitchen rituals.
              </span>
            </div>
          </label>
        </fieldset>

        {/* Region */}
        <div className="register__field">
          <label className="register__label" htmlFor="reg-region">
            Region
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

        {/* Language */}
        <div className="register__field">
          <label className="register__label" htmlFor="reg-language">
            Language
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

        {/* Submit */}
        <button
          type="submit"
          className="register__submit"
          id="reg-submit"
          disabled={loading}
        >
          {loading ? (
            <span className="register__spinner" />
          ) : (
            'Create Heirloom Account'
          )}
        </button>

        {/* Social divider */}
        <div className="register__or-divider">
          <span>OR CONNECT WITH</span>
        </div>

        {/* Social auth */}
        <div className="register__social">
          <button className="register__social-btn" id="reg-google-auth" type="button">
            <img src={googleLogo} alt="" width="18" height="18" />
            <span>Google</span>
          </button>
          <button className="register__social-btn register__social-btn--apple" id="reg-apple-auth" type="button">
            <img src={appleLogo} alt="" width="18" height="18" />
            <span>Apple</span>
          </button>
        </div>

        {/* Footer */}
        <p className="register__footer">
          Already have an account?{' '}
          <Link to="/login" className="register__footer-link" id="reg-go-login">
            Sign In
          </Link>
        </p>
      </form>
    </div>
  )
}
