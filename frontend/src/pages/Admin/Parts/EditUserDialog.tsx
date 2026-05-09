import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { AdminUser, AdminUserUpdate } from '@/services/types/admin'

interface Props {
  user: AdminUser
  busy: boolean
  onCancel: () => void
  onSave: (updates: AdminUserUpdate) => void
}

type NonAdminRole = Exclude<NonNullable<AdminUserUpdate['role']>, 'admin'>
const NON_ADMIN_ROLES: NonAdminRole[] = ['learner', 'cook', 'expert']

/** Pulls only the fields that actually changed. The PATCH endpoint requires
 *  at least one field, so the Save button is disabled when nothing changed. */
interface FormState {
  username: string
  role: NonAdminRole
  bio: string
  region: string
  preferred_language: string
}

function buildPatch(form: FormState, original: AdminUser): AdminUserUpdate {
  const out: AdminUserUpdate = {}
  if (form.username.trim() !== original.username) out.username = form.username.trim()
  if (form.role !== original.role) out.role = form.role
  if (form.bio !== (original.bio ?? '')) out.bio = form.bio
  if (form.region !== (original.region ?? '')) out.region = form.region
  if (form.preferred_language !== (original.preferred_language ?? '')) {
    out.preferred_language = form.preferred_language
  }
  return out
}

export function EditUserDialog({ user, busy, onCancel, onSave }: Props) {
  const { t } = useTranslation('common')
  const titleId = useId()
  const usernameRef = useRef<HTMLInputElement>(null)

  const initialRole: NonAdminRole = user.role === 'admin' ? 'expert' : user.role
  const [form, setForm] = useState<FormState>({
    username: user.username,
    role: initialRole,
    bio: user.bio ?? '',
    region: user.region ?? '',
    preferred_language: user.preferred_language ?? '',
  })

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    usernameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [busy, onCancel])

  const patch = buildPatch(form, user)
  const dirty = Object.keys(patch).length > 0

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="admin-modal__backdrop" onClick={() => (busy ? null : onCancel())} />
      <div className="admin-modal__panel admin-modal__panel--wide" role="document">
        <h2 id={titleId} className="admin-modal__title">
          {t('admin.users.editTitle', { username: user.username })}
        </h2>

        <div className="admin-form-grid">
          <label className="admin-field">
            <span className="admin-field-label">{t('admin.users.usernameLabel')}</span>
            <input
              ref={usernameRef}
              className="admin-input"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              disabled={busy}
              maxLength={30}
            />
          </label>

          <label className="admin-field">
            <span className="admin-field-label">{t('admin.users.roleLabel')}</span>
            <select
              className="admin-input"
              value={form.role}
              onChange={(e) =>
                setForm((f) => ({ ...f, role: e.target.value as NonAdminRole }))
              }
              disabled={busy}
            >
              {NON_ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`app.roles.${r}`)}
                </option>
              ))}
            </select>
            <span className="admin-field-hint">{t('admin.users.roleHint')}</span>
          </label>

          <label className="admin-field admin-field--full">
            <span className="admin-field-label">{t('admin.users.bio')}</span>
            <textarea
              className="admin-textarea"
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              maxLength={500}
              disabled={busy}
            />
          </label>

          <label className="admin-field">
            <span className="admin-field-label">{t('admin.users.region')}</span>
            <input
              className="admin-input"
              value={form.region}
              onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
              disabled={busy}
              maxLength={100}
            />
          </label>

          <label className="admin-field">
            <span className="admin-field-label">{t('admin.users.preferredLanguage')}</span>
            <input
              className="admin-input"
              value={form.preferred_language}
              onChange={(e) => setForm((f) => ({ ...f, preferred_language: e.target.value }))}
              placeholder="en | tr"
              disabled={busy}
              maxLength={10}
            />
          </label>
        </div>

        <div className="admin-modal__actions">
          <button
            type="button"
            className="admin-btn admin-btn--ghost"
            onClick={onCancel}
            disabled={busy}
          >
            {t('admin.cancel')}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => onSave(patch)}
            disabled={busy || !dirty}
            aria-busy={busy}
          >
            {busy ? <span className="ui-spinner" aria-hidden /> : t('admin.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
