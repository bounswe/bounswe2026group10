import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import {
  culturalTagRequest,
  dishGenreRequest,
  dishVarietyRequest,
} from '@/services/content-request-service'
import './SuggestionModal.css'

export type SuggestionKind = 'cultural' | 'genre' | 'variety'

export interface SuggestionModalProps {
  kind: SuggestionKind
  isOpen: boolean
  onClose: () => void
  /** Fires after a successful submission so the parent can show inline confirmation. */
  onSuccess: () => void
  /** For kind='variety': prefilled parent genre id (from the recipe form). */
  prefillGenreId?: number
  /** For kind='cultural': country options for the dropdown. */
  countryOptions?: string[]
  /** For kind='variety': genre options for the dropdown. */
  genreOptions?: Array<{ id: string; name: string }>
}

export function SuggestionModal({
  kind,
  isOpen,
  onClose,
  onSuccess,
  prefillGenreId,
  countryOptions = [],
  genreOptions = [],
}: SuggestionModalProps) {
  const { t } = useTranslation('common')
  const titleId = useId()
  const firstInputRef = useRef<HTMLInputElement>(null)

  const [labelEn, setLabelEn] = useState('')
  const [labelTr, setLabelTr] = useState('')
  const [country, setCountry] = useState('')
  const [genreId, setGenreId] = useState<string>('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionTr, setDescriptionTr] = useState('')
  const [showMore, setShowMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state every time the modal opens.
  useEffect(() => {
    if (!isOpen) return
    setLabelEn('')
    setLabelTr('')
    setCountry('')
    setGenreId(prefillGenreId != null ? String(prefillGenreId) : '')
    setDescriptionEn('')
    setDescriptionTr('')
    setShowMore(false)
    setSubmitting(false)
    setError(null)
  }, [isOpen, prefillGenreId])

  // Body scroll lock + ESC + focus management.
  useEffect(() => {
    if (!isOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusTimer = window.setTimeout(() => firstInputRef.current?.focus(), 30)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(focusTimer)
    }
  }, [isOpen, onClose, submitting])

  const titleKey = useMemo(() => {
    if (kind === 'cultural') return 'suggestion.title.cultural'
    if (kind === 'genre') return 'suggestion.title.genre'
    return 'suggestion.title.variety'
  }, [kind])

  const hasAtLeastOneLabel = useMemo(() => {
    if (kind === 'cultural') return labelEn.trim().length > 0 || labelTr.trim().length > 0
    return labelEn.trim().length > 0 || labelTr.trim().length > 0
  }, [kind, labelEn, labelTr])

  // For variety we reuse labelEn/labelTr state as nameEn/nameTr; same fields.
  const canSubmit = useMemo(() => {
    if (submitting) return false
    if (!hasAtLeastOneLabel) return false
    if (kind === 'variety' && !genreId) return false
    return true
  }, [submitting, hasAtLeastOneLabel, kind, genreId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      const en = labelEn.trim() || undefined
      const tr = labelTr.trim() || undefined
      const descEn = descriptionEn.trim() || undefined
      const descTr = descriptionTr.trim() || undefined
      if (kind === 'cultural') {
        await culturalTagRequest.create({
          labelEn: en,
          labelTr: tr,
          country: country.trim() || undefined,
        })
      } else if (kind === 'genre') {
        await dishGenreRequest.create({
          nameEn: en,
          nameTr: tr,
          descriptionEn: descEn,
          descriptionTr: descTr,
        })
      } else {
        await dishVarietyRequest.create({
          genreId: Number(genreId),
          nameEn: en,
          nameTr: tr,
          descriptionEn: descEn,
          descriptionTr: descTr,
        })
      }
      onSuccess()
    } catch (err) {
      const apiMsg = isAxiosError(err)
        ? (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message
        : null
      setError(apiMsg || t('suggestion.errors.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const labelLeftKey = kind === 'cultural' ? 'suggestion.fields.labelEn' : 'suggestion.fields.nameEn'
  const labelRightKey = kind === 'cultural' ? 'suggestion.fields.labelTr' : 'suggestion.fields.nameTr'

  return (
    <div
      className="suggestion-modal-overlay"
      role="presentation"
      onClick={() => {
        if (!submitting) onClose()
      }}
    >
      <div
        className="suggestion-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="suggestion-modal__title">
          {t(titleKey)}
        </h2>
        <p className="suggestion-modal__hint">{t('suggestion.hint')}</p>

        <form className="suggestion-modal__form" onSubmit={handleSubmit}>
          <div className="suggestion-modal__row">
            <div className="suggestion-modal__field">
              <label className="suggestion-modal__label" htmlFor={`${titleId}-en`}>
                {t(labelLeftKey)}
              </label>
              <input
                id={`${titleId}-en`}
                ref={firstInputRef}
                type="text"
                className="suggestion-modal__input"
                value={labelEn}
                onChange={(e) => setLabelEn(e.target.value)}
                maxLength={200}
                disabled={submitting}
              />
            </div>
            <div className="suggestion-modal__field">
              <label className="suggestion-modal__label" htmlFor={`${titleId}-tr`}>
                {t(labelRightKey)}
              </label>
              <input
                id={`${titleId}-tr`}
                type="text"
                className="suggestion-modal__input"
                value={labelTr}
                onChange={(e) => setLabelTr(e.target.value)}
                maxLength={200}
                disabled={submitting}
              />
            </div>
          </div>

          {kind === 'cultural' && (
            <div className="suggestion-modal__field">
              <label className="suggestion-modal__label" htmlFor={`${titleId}-country`}>
                {t('suggestion.fields.country')}
              </label>
              <select
                id={`${titleId}-country`}
                className="suggestion-modal__select"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={submitting}
              >
                <option value="">{t('suggestion.fields.countryAny')}</option>
                {countryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          {kind === 'variety' && (
            <div className="suggestion-modal__field">
              <label className="suggestion-modal__label" htmlFor={`${titleId}-genre`}>
                {t('suggestion.fields.genre')}
              </label>
              <select
                id={`${titleId}-genre`}
                className="suggestion-modal__select"
                value={genreId}
                onChange={(e) => setGenreId(e.target.value)}
                disabled={submitting}
                required
              >
                <option value="">{t('suggestion.fields.genrePlaceholder')}</option>
                {genreOptions.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          {(kind === 'genre' || kind === 'variety') && (
            <>
              {!showMore && (
                <button
                  type="button"
                  className="suggestion-modal__toggle"
                  onClick={() => setShowMore(true)}
                >
                  {t('suggestion.showMore')}
                </button>
              )}
              {showMore && (
                <div className="suggestion-modal__row">
                  <div className="suggestion-modal__field">
                    <label className="suggestion-modal__label" htmlFor={`${titleId}-desc-en`}>
                      {t('suggestion.fields.descriptionEn')}
                    </label>
                    <textarea
                      id={`${titleId}-desc-en`}
                      className="suggestion-modal__textarea"
                      value={descriptionEn}
                      onChange={(e) => setDescriptionEn(e.target.value)}
                      maxLength={2000}
                      disabled={submitting}
                    />
                  </div>
                  <div className="suggestion-modal__field">
                    <label className="suggestion-modal__label" htmlFor={`${titleId}-desc-tr`}>
                      {t('suggestion.fields.descriptionTr')}
                    </label>
                    <textarea
                      id={`${titleId}-desc-tr`}
                      className="suggestion-modal__textarea"
                      value={descriptionTr}
                      onChange={(e) => setDescriptionTr(e.target.value)}
                      maxLength={2000}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {error && <p className="suggestion-modal__error" role="alert">{error}</p>}

          <div className="suggestion-modal__actions">
            <button
              type="button"
              className="suggestion-modal__btn suggestion-modal__btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              {t('suggestion.cancel')}
            </button>
            <button
              type="submit"
              className="suggestion-modal__btn suggestion-modal__btn--primary"
              disabled={!canSubmit}
              aria-busy={submitting}
            >
              <span className="suggestion-modal__btn-content">
                <span
                  className={
                    submitting
                      ? 'suggestion-modal__btn-label suggestion-modal__btn-label--hidden'
                      : 'suggestion-modal__btn-label'
                  }
                >
                  {t('suggestion.submit')}
                </span>
                {submitting && (
                  <span className="suggestion-modal__btn-spinner-wrap" aria-hidden>
                    <span className="ui-spinner suggestion-modal__btn-spinner" />
                  </span>
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
