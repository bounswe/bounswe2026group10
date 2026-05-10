import { useTranslation } from 'react-i18next'
import type { DishGenreRequest, DishVarietyRequest } from '@/services/types/admin'

interface Props {
  type: 'genre' | 'variety'
  request: DishGenreRequest | DishVarietyRequest
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

export function ContentRequestRow({ type, request, onApprove, onReject }: Props) {
  const { t } = useTranslation('common')
  const isPending = request.status === 'pending'
  const varietyRequest = request as DishVarietyRequest

  return (
    <li className="admin-card">
      <div className="admin-card__head">
        <div className="admin-card__heading">
          <strong className="admin-card__title">
            {request.requester?.username ?? t('admin.contentRequests.unknownRequester')}
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
          <dt>{t('admin.contentRequests.nameEn')}</dt>
          <dd>{request.nameEn ?? '—'}</dd>
        </div>
        <div>
          <dt>{t('admin.contentRequests.nameTr')}</dt>
          <dd>{request.nameTr ?? '—'}</dd>
        </div>
        {request.descriptionEn && (
          <div>
            <dt>{t('admin.contentRequests.descriptionEn')}</dt>
            <dd>
              {request.descriptionEn.length > 100
                ? `${request.descriptionEn.slice(0, 100)}…`
                : request.descriptionEn}
            </dd>
          </div>
        )}
        {type === 'variety' && (
          <div>
            <dt>{t('admin.contentRequests.genreId')}</dt>
            <dd>{varietyRequest.genreId}</dd>
          </div>
        )}
        {!isPending && (
          <>
            <div>
              <dt>{t('admin.contentRequests.decisionAt')}</dt>
              <dd>{formatDate(request.decidedAt)}</dd>
            </div>
            {request.decisionNote && (
              <div>
                <dt>{t('admin.contentRequests.decisionNote')}</dt>
                <dd className="admin-card__reason">{request.decisionNote}</dd>
              </div>
            )}
          </>
        )}
      </dl>

      {isPending && (
        <div className="admin-card__actions">
          <button type="button" className="admin-btn admin-btn--primary" onClick={onApprove}>
            {t('admin.contentRequests.approve')}
          </button>
          <button type="button" className="admin-btn admin-btn--danger" onClick={onReject}>
            {t('admin.contentRequests.reject')}
          </button>
        </div>
      )}
    </li>
  )
}
