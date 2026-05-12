import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { updateProfileAsync } from '@/store/slices/profile-slice'
import { mediaService } from '@/services/media-service'
import type { ProfileUpdatePayload } from '@/services/profile-service'

interface Props {
  onClose: () => void
}

const LANGUAGES = ['en', 'tr'] as const
type SupportedLanguage = (typeof LANGUAGES)[number]

interface FormState {
  username: string
  bio: string
  region: string
  preferredLanguage: '' | SupportedLanguage
  avatarUrl: string
}

/**
 * Inline profile editor. Backend `GET /auth/me` does not return bio / avatar
 * / region / preferred_language, so fields are pre-filled from any values
 * already in the profile slice (populated by previous PATCH responses in
 * this session). A hint near the title explains that blank fields are left
 * unchanged.
 */
export function ProfileEditForm({ onClose }: Props) {
  const { t } = useTranslation('common')
  const dispatch = useAppDispatch()
  const profile = useAppSelector((s) => s.profile)
  const formId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>({
    username: profile.username ?? '',
    bio: profile.bio ?? '',
    region: profile.region ?? '',
    preferredLanguage: (profile.preferredLanguage as SupportedLanguage | null) ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving && !uploading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving, uploading])

  function buildPayload(): ProfileUpdatePayload {
    const out: ProfileUpdatePayload = {}
    const username = form.username.trim()
    if (username && username !== (profile.username ?? '')) {
      out.username = username
    }
    if (form.bio !== (profile.bio ?? '')) {
      out.bio = form.bio
    }
    if (form.region !== (profile.region ?? '')) {
      out.region = form.region
    }
    const lang = form.preferredLanguage
    if (lang !== (profile.preferredLanguage ?? '')) {
      out.preferredLanguage = lang
    }
    if (form.avatarUrl && form.avatarUrl !== (profile.avatarUrl ?? '')) {
      out.avatarUrl = form.avatarUrl
    }
    return out
  }

  async function handleAvatarPick(file: File) {
    setUploadError(null)
    if (!file.type.startsWith('image/')) {
      setUploadError(t('profileEdit.avatarTypeError'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError(t('profileEdit.avatarSizeError'))
      return
    }
    setUploading(true)
    try {
      const result = await mediaService.uploadFile(file)
      setForm((f) => ({ ...f, avatarUrl: result.url }))
    } catch {
      setUploadError(t('profileEdit.avatarUploadError'))
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setFieldError(null)

    const username = form.username.trim()
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      setFieldError({ field: 'username', message: t('profileEdit.usernameInvalid') })
      return
    }
    if (username && (username.length < 3 || username.length > 30)) {
      setFieldError({ field: 'username', message: t('profileEdit.usernameLength') })
      return
    }
    if (form.bio.length > 500) {
      setFieldError({ field: 'bio', message: t('profileEdit.bioLength') })
      return
    }

    const payload = buildPayload()
    if (Object.keys(payload).length === 0) {
      onClose()
      return
    }

    setSaving(true)
    const result = await dispatch(updateProfileAsync(payload))
    setSaving(false)

    if (updateProfileAsync.fulfilled.match(result)) {
      onClose()
      return
    }
    const rejected = result.payload as { code?: string; message: string } | undefined
    if (rejected?.code === 'CONFLICT') {
      setFieldError({ field: 'username', message: t('profileEdit.usernameTaken') })
    } else {
      setError(rejected?.message ?? t('profileEdit.genericError'))
    }
  }

  const initials = form.username
    ? form.username.slice(0, 2).toUpperCase()
    : (profile.username ?? '??').slice(0, 2).toUpperCase()

  return (
    <form
      id={formId}
      className="profile-edit"
      onSubmit={handleSubmit}
      aria-busy={saving || uploading}
    >
      <div className="profile-edit__header">
        <h2 className="profile-edit__title">{t('profileEdit.title')}</h2>
        <p className="profile-edit__hint">{t('profileEdit.hint')}</p>
      </div>

      <div className="profile-edit__avatar-row">
        <div className="profile-edit__avatar-preview">
          {form.avatarUrl ? (
            <img src={form.avatarUrl} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="profile-edit__avatar-controls">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="profile-edit__avatar-input"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleAvatarPick(f)
              e.target.value = ''
            }}
          />
          <button
            type="button"
            className="profile-edit__btn profile-edit__btn--ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || saving}
          >
            {uploading
              ? <span className="ui-spinner" aria-hidden />
              : t('profileEdit.changeAvatar')}
          </button>
          {form.avatarUrl && (
            <button
              type="button"
              className="profile-edit__btn profile-edit__btn--link"
              onClick={() => setForm((f) => ({ ...f, avatarUrl: '' }))}
              disabled={uploading || saving}
            >
              {t('profileEdit.removeAvatar')}
            </button>
          )}
          {uploadError && <p className="profile-edit__error">{uploadError}</p>}
        </div>
      </div>

      <label className="profile-edit__field">
        <span className="profile-edit__label">{t('profileEdit.usernameLabel')}</span>
        <input
          type="text"
          className="profile-edit__input"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          maxLength={30}
          disabled={saving}
          autoComplete="username"
        />
        {fieldError?.field === 'username' && (
          <span className="profile-edit__error">{fieldError.message}</span>
        )}
      </label>

      <label className="profile-edit__field">
        <span className="profile-edit__label">{t('profileEdit.bioLabel')}</span>
        <textarea
          className="profile-edit__textarea"
          value={form.bio}
          onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          maxLength={500}
          rows={3}
          disabled={saving}
        />
        <span className="profile-edit__hint-line">{form.bio.length}/500</span>
        {fieldError?.field === 'bio' && (
          <span className="profile-edit__error">{fieldError.message}</span>
        )}
      </label>

      <label className="profile-edit__field">
        <span className="profile-edit__label">{t('profileEdit.regionLabel')}</span>
        <input
          type="text"
          className="profile-edit__input"
          value={form.region}
          onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
          maxLength={100}
          disabled={saving}
          placeholder={t('profileEdit.regionPlaceholder')}
        />
      </label>

      <label className="profile-edit__field">
        <span className="profile-edit__label">{t('profileEdit.languageLabel')}</span>
        <select
          className="profile-edit__input"
          value={form.preferredLanguage}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              preferredLanguage: e.target.value as '' | SupportedLanguage,
            }))
          }
          disabled={saving}
        >
          <option value="">{t('profileEdit.languageNone')}</option>
          {LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {t(`profileEdit.languages.${code}`)}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="profile-edit__error profile-edit__error--global">{error}</p>}

      <div className="profile-edit__actions">
        <button
          type="button"
          className="profile-edit__btn profile-edit__btn--ghost"
          onClick={onClose}
          disabled={saving}
        >
          {t('profileEdit.cancel')}
        </button>
        <button
          type="submit"
          className="profile-edit__btn profile-edit__btn--primary"
          disabled={saving || uploading}
          aria-busy={saving}
        >
          {saving ? <span className="ui-spinner" aria-hidden /> : t('profileEdit.save')}
        </button>
      </div>
    </form>
  )
}
