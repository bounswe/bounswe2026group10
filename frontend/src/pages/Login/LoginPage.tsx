import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import googleLogo from '@/assets/logo-google.svg'
import appleLogo from '@/assets/logo-apple.svg'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginAsync, clearError } from '@/store/slices/auth-slice'
import { fetchProfileAsync } from '@/store/slices/profile-slice'
import './LoginPage.css'

interface LoginForm {
  email: string
  password: string
  rememberMe: boolean
}

export function LoginPage() {
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
    const e: { email?: string; password?: string } = {}
    if (!form.email.trim()) e.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Please enter a valid email address.'
    if (!form.password) e.password = 'Password is required.'
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
      {/* Header */}
      <header className="login__header">
        <Link to="/" className="login__back" aria-label="Go back">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="login__header-title">Roots &amp; Recipes</span>
      </header>

      {/* Main content */}
      <div className="login__body">
        {/* Heading */}
        <div className="login__heading">
          <h1 className="login__title">
            Welcome <em>back</em>
          </h1>
          <p className="login__subtitle">
            Rediscover the tastes that connect generations.
          </p>
        </div>

        {/* Form */}
        <form className="login__form" onSubmit={handleSubmit} noValidate>
          {serverError && (
            <div className="login__alert" role="alert" id="login-server-error">
              {serverError}
            </div>
          )}

          {/* Email */}
          <div className="login__field">
            <input
              className={`login__input ${errors.email ? 'login__input--error' : ''}`}
              id="login-email"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              autoComplete="email"
            />
            {errors.email && <span className="login__error">{errors.email}</span>}
          </div>

          {/* Password */}
          <div className="login__field">
            <div className="login__input-wrap">
              <input
                className={`login__input ${errors.password ? 'login__input--error' : ''}`}
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login__toggle-pw"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
              Forgot Password?
            </button>
          </div>

          {/* Remember me */}
          <label className="login__remember" htmlFor="login-remember">
            <span>Remember me</span>
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

          {/* Submit */}
          <button
            type="submit"
            className="login__submit"
            id="login-submit"
            disabled={loading}
          >
            {loading ? <span className="login__spinner" /> : 'Sign In'}
          </button>
        </form>

        {/* Social divider */}
        <div className="login__or-divider">
          <span>OR CONTINUE WITH</span>
        </div>

        {/* Social auth */}
        <div className="login__social">
          <button className="login__social-btn login__social-btn--google" id="login-google-auth" type="button">
            <img src={googleLogo} alt="" width="20" height="20" />
            <span>Continue with Google</span>
          </button>
          <button className="login__social-btn login__social-btn--apple" id="login-apple-auth" type="button">
            <img src={appleLogo} alt="" width="20" height="20" />
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Footer */}
        <p className="login__footer">
          Don't have an account?{' '}
          <Link to="/register" className="login__footer-link" id="login-go-register">
            Register
          </Link>
        </p>

        <div className="login__legal">
          <a href="#privacy">Privacy Policy</a>
          <span className="login__legal-dot">•</span>
          <a href="#terms">Terms of Service</a>
        </div>
      </div>

      {/* Forgot password modal */}
      {showForgotModal && (
        <div className="login__modal-overlay" onClick={() => { setShowForgotModal(false); setForgotSent(false) }}>
          <div className="login__modal" onClick={(e) => e.stopPropagation()} id="forgot-password-modal">
            <button
              className="login__modal-close"
              onClick={() => { setShowForgotModal(false); setForgotSent(false) }}
              aria-label="Close"
              type="button"
            >
              ✕
            </button>
            <h2 className="login__modal-title">Forgot Password</h2>
            {forgotSent ? (
              <div className="login__modal-success">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-positive)" strokeWidth="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p>A password reset link has been sent to your email.</p>
                <button
                  className="login__submit"
                  onClick={() => { setShowForgotModal(false); setForgotSent(false) }}
                  type="button"
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p className="login__modal-desc">
                  Enter your email address and we'll send you a reset link.
                </p>
                <input
                  className="login__input"
                  type="email"
                  placeholder="Email Address"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  id="forgot-email-input"
                  autoComplete="email"
                />
                <button className="login__submit" type="submit" style={{ marginTop: '1rem' }}>
                  Send Reset Link
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
