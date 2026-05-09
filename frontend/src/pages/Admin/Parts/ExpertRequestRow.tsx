import { useTranslation } from 'react-i18next'
import type { ExpertRequest } from '@/services/types/admin'

interface Props {
  request: ExpertRequest
  onApprove: () => void
  onReject: () => void
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export function ExpertRequestRow({ request, onApprove, onReject }: Props) {
  const { t } = useTranslation('common')
  const isPending = request.status === 'pending'

  return (
    <li className="admin-card">
      <div className="admin-card__head">
        <div className="admin-card__heading">
          <strong className="admin-card__title">
            {request.applicant?.username ?? t('admin.requests.unknownApplicant')}
          </strong>
          <span
            className={`admin-badge admin-badge--${request.status}`}
            aria-label={t(`admin.requests.status.${request.status}`)}
          >
            {t(`admin.requests.status.${request.status}`)}
          </span>
        </div>
        <span className="admin-card__time">{formatDate(request.createdAt)}</span>
      </div>

      <dl className="admin-card__body">
        <div>
          <dt>{t('admin.requests.currentRole')}</dt>
          <dd>
            {request.applicant?.role
              ? t(`app.roles.${request.applicant.role}`)
              : '—'}
          </dd>
        </div>
        <div>
          <dt>{t('admin.requests.reason')}</dt>
          <dd className="admin-card__reason">
            {request.reason?.trim() ? request.reason : <em>{t('admin.requests.noReason')}</em>}
          </dd>
        </div>
        {!isPending && (
          <>
            <div>
              <dt>{t('admin.requests.decisionAt')}</dt>
              <dd>{formatDate(request.decidedAt)}</dd>
            </div>
            {request.decisionNote && (
              <div>
                <dt>{t('admin.requests.decisionNote')}</dt>
                <dd className="admin-card__reason">{request.decisionNote}</dd>
              </div>
            )}
          </>
        )}
      </dl>

      {isPending && (
        <div className="admin-card__actions">
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={onApprove}
          >
            {t('admin.requests.approve')}
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--danger"
            onClick={onReject}
          >
            {t('admin.requests.reject')}
          </button>
        </div>
      )}
    </li>
  )
}
