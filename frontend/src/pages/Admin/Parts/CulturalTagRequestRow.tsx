import { useTranslation } from 'react-i18next'
import type { CulturalTagRequest } from '@/services/types/admin'

interface Props {
  request: CulturalTagRequest
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

export function CulturalTagRequestRow({ request, onApprove, onReject }: Props) {
  const { t } = useTranslation('common')
  const isPending = request.status === 'pending'

  return (
    <li className="admin-card">
      <div className="admin-card__head">
        <div className="admin-card__heading">
          <strong className="admin-card__title">
            {request.requester?.username ?? t('admin.culturalTags.unknownRequester')}
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
          <dt>{t('admin.culturalTags.labelEn')}</dt>
          <dd>{request.labelEn ?? '—'}</dd>
        </div>
        <div>
          <dt>{t('admin.culturalTags.labelTr')}</dt>
          <dd>{request.labelTr ?? '—'}</dd>
        </div>
        <div>
          <dt>{t('admin.culturalTags.country')}</dt>
          <dd>{request.country ?? <em>{t('admin.culturalTags.global')}</em>}</dd>
        </div>
        {!isPending && (
          <>
            <div>
              <dt>{t('admin.culturalTags.decisionAt')}</dt>
              <dd>{formatDate(request.decidedAt)}</dd>
            </div>
            {request.decisionNote && (
              <div>
                <dt>{t('admin.culturalTags.decisionNote')}</dt>
                <dd className="admin-card__reason">{request.decisionNote}</dd>
              </div>
            )}
          </>
        )}
      </dl>

      {isPending && (
        <div className="admin-card__actions">
          <button type="button" className="admin-btn admin-btn--primary" onClick={onApprove}>
            {t('admin.culturalTags.approve')}
          </button>
          <button type="button" className="admin-btn admin-btn--danger" onClick={onReject}>
            {t('admin.culturalTags.reject')}
          </button>
        </div>
      )}
    </li>
  )
}
