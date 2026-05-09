import { useTranslation } from 'react-i18next'
import type { AdminUser } from '@/services/types/admin'

interface Props {
  user: AdminUser
  onEdit: () => void
  onDelete: () => void
}

export function UserRow({ user, onEdit, onDelete }: Props) {
  const { t } = useTranslation('common')
  const isAdmin = user.role === 'admin'

  return (
    <li className="admin-card">
      <div className="admin-card__head">
        <div className="admin-card__heading">
          <strong className="admin-card__title">{user.username}</strong>
          <span className={`admin-badge admin-badge--role-${user.role}`}>
            {t(`app.roles.${user.role}`)}
          </span>
        </div>
        <span className="admin-card__time">
          {t('admin.users.createdAt')}: {new Date(user.created_at).toLocaleDateString()}
        </span>
      </div>

      <dl className="admin-card__body">
        <div>
          <dt>{t('admin.users.region')}</dt>
          <dd>{user.region ?? '—'}</dd>
        </div>
        <div>
          <dt>{t('admin.users.preferredLanguage')}</dt>
          <dd>{user.preferred_language ?? '—'}</dd>
        </div>
        {user.bio && (
          <div>
            <dt>{t('admin.users.bio')}</dt>
            <dd className="admin-card__reason">{user.bio}</dd>
          </div>
        )}
      </dl>

      <div className="admin-card__actions">
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={onEdit}
          disabled={isAdmin}
          title={isAdmin ? t('admin.users.adminProtected') : undefined}
        >
          {t('admin.users.edit')}
        </button>
        <button
          type="button"
          className="admin-btn admin-btn--danger"
          onClick={onDelete}
          disabled={isAdmin}
          title={isAdmin ? t('admin.users.adminProtected') : undefined}
        >
          {t('admin.users.delete')}
        </button>
      </div>
    </li>
  )
}
