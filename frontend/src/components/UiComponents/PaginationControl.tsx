import { useTranslation } from 'react-i18next'

export interface PaginationControlProps {
  currentPage: number
  totalPages: number
  onPreviousClick: () => void
  onNextClick: () => void
  isLoading?: boolean
}

function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function PaginationControl({
  currentPage,
  totalPages,
  onPreviousClick,
  onNextClick,
  isLoading = false,
}: PaginationControlProps) {
  const { t } = useTranslation('common')

  const hasPrevious = currentPage > 1
  const hasNext = currentPage < totalPages

  return (
    <div className="pagination-control" role="navigation" aria-label="Pagination">
      <button
        type="button"
        className="pagination-control__btn pagination-control__btn--prev"
        onClick={onPreviousClick}
        disabled={!hasPrevious || isLoading}
        aria-label={t('discovery.previousPage')}
      >
        <ChevronLeftIcon />
        <span className="pagination-control__text">{t('discovery.previousPage')}</span>
      </button>

      <div className="pagination-control__info" role="status" aria-live="polite">
        {t('discovery.pagination', { page: currentPage, total: totalPages })}
      </div>

      <button
        type="button"
        className="pagination-control__btn pagination-control__btn--next"
        onClick={onNextClick}
        disabled={!hasNext || isLoading}
        aria-label={t('discovery.nextPage')}
      >
        <span className="pagination-control__text">{t('discovery.nextPage')}</span>
        <ChevronRightIcon />
      </button>
    </div>
  )
}
