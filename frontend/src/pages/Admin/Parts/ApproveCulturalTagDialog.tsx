import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ApproveCulturalTagPayload, CulturalTagRequest } from '@/services/types/admin'

interface Props {
  request: CulturalTagRequest
  busy: boolean
  onCancel: () => void
  onSubmit: (payload: ApproveCulturalTagPayload) => void
}

export function ApproveCulturalTagDialog({ request, busy, onCancel, onSubmit }: Props) {
  const { t } = useTranslation('common')
  const titleId = useId()

  const [labelEn, setLabelEn] = useState(request.labelEn ?? '')
  const [labelTr, setLabelTr] = useState(request.labelTr ?? '')
  const [country, setCountry] = useState(request.country ?? '')
  const [note, setNote] = useState('')

  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    firstInputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [busy, onCancel])

  function handleSubmit() {
    const payload: ApproveCulturalTagPayload = {}
    const en = labelEn.trim()
    const tr = labelTr.trim()
    const ct = country.trim()
    const n = note.trim()
    if (en) payload.labelEn = en
    if (tr) payload.labelTr = tr
    if (ct) payload.country = ct
    if (n) payload.decisionNote = n
    onSubmit(payload)
  }

  const labelEnId = useId()
  const labelTrId = useId()
  const countryId = useId()
  const noteId = useId()

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="admin-modal__backdrop" onClick={() => (busy ? null : onCancel())} />
      <div className="admin-modal__panel" role="document">
        <h2 id={titleId} className="admin-modal__title">
          {t('admin.culturalTags.approveTitle')}
        </h2>

        <label htmlFor={labelEnId} className="admin-field-label">
          {t('admin.culturalTags.labelEnLabel')}
        </label>
        <input
          id={labelEnId}
          ref={firstInputRef}
          type="text"
          className="admin-input"
          value={labelEn}
          onChange={(e) => setLabelEn(e.target.value)}
          maxLength={100}
          disabled={busy}
          required
        />

        <label htmlFor={labelTrId} className="admin-field-label" style={{ marginTop: '0.75rem' }}>
          {t('admin.culturalTags.labelTrLabel')}
        </label>
        <input
          id={labelTrId}
          type="text"
          className="admin-input"
          value={labelTr}
          onChange={(e) => setLabelTr(e.target.value)}
          maxLength={100}
          disabled={busy}
        />

        <label htmlFor={countryId} className="admin-field-label" style={{ marginTop: '0.75rem' }}>
          {t('admin.culturalTags.countryLabel')}
        </label>
        <input
          id={countryId}
          type="text"
          className="admin-input"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          maxLength={100}
          disabled={busy}
          placeholder={t('admin.culturalTags.global')}
        />

        <label htmlFor={noteId} className="admin-field-label" style={{ marginTop: '0.75rem' }}>
          {t('admin.culturalTags.decisionNoteLabel')}
        </label>
        <textarea
          id={noteId}
          className="admin-textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('admin.culturalTags.decisionNotePlaceholder')}
          rows={3}
          maxLength={2000}
          disabled={busy}
        />
        <span className="admin-field-hint">
          {note.length}/2000 — {t('admin.culturalTags.decisionNoteOptional')}
        </span>

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
            onClick={handleSubmit}
            disabled={busy || !labelEn.trim()}
            aria-busy={busy}
          >
            {busy ? <span className="ui-spinner" aria-hidden /> : t('admin.culturalTags.approveConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
