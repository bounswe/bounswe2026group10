import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type {
  ApproveDishGenrePayload,
  ApproveDishVarietyPayload,
  DishGenreRequest,
  DishVarietyRequest,
} from '@/services/types/admin'

interface Props {
  type: 'genre' | 'variety'
  request: DishGenreRequest | DishVarietyRequest
  busy: boolean
  onCancel: () => void
  onSubmit: (payload: ApproveDishGenrePayload | ApproveDishVarietyPayload) => void
}

export function ApproveContentRequestDialog({ type, request, busy, onCancel, onSubmit }: Props) {
  const { t } = useTranslation('common')
  const titleId = useId()

  const [nameEn, setNameEn] = useState(request.nameEn ?? '')
  const [nameTr, setNameTr] = useState(request.nameTr ?? '')
  const [descriptionEn, setDescriptionEn] = useState(request.descriptionEn ?? '')
  const [descriptionTr, setDescriptionTr] = useState(request.descriptionTr ?? '')
  const [genreId, setGenreId] = useState(
    type === 'variety' ? String((request as DishVarietyRequest).genreId) : ''
  )
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
    const en = nameEn.trim()
    const tr = nameTr.trim()
    const descEn = descriptionEn.trim()
    const descTr = descriptionTr.trim()
    const n = note.trim()

    if (type === 'genre') {
      const payload: ApproveDishGenrePayload = {}
      if (en) payload.nameEn = en
      if (tr) payload.nameTr = tr
      if (descEn) payload.descriptionEn = descEn
      if (descTr) payload.descriptionTr = descTr
      if (n) payload.decisionNote = n
      onSubmit(payload)
    } else {
      const payload: ApproveDishVarietyPayload = {}
      if (en) payload.nameEn = en
      if (tr) payload.nameTr = tr
      if (descEn) payload.descriptionEn = descEn
      if (descTr) payload.descriptionTr = descTr
      const gid = Number(genreId)
      if (Number.isInteger(gid) && gid > 0) payload.genreId = gid
      if (n) payload.decisionNote = n
      onSubmit(payload)
    }
  }

  const nameEnId = useId()
  const nameTrId = useId()
  const descriptionEnId = useId()
  const descriptionTrId = useId()
  const genreIdInputId = useId()
  const noteId = useId()

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="admin-modal__backdrop" onClick={() => (busy ? null : onCancel())} />
      <div className="admin-modal__panel" role="document">
        <h2 id={titleId} className="admin-modal__title">
          {t('admin.contentRequests.approveTitle')}
        </h2>

        <label htmlFor={nameEnId} className="admin-field-label">
          {t('admin.contentRequests.nameEnLabel')}
        </label>
        <input
          id={nameEnId}
          ref={firstInputRef}
          type="text"
          className="admin-input"
          value={nameEn}
          onChange={(e) => setNameEn(e.target.value)}
          maxLength={200}
          disabled={busy}
          required
        />

        <label htmlFor={nameTrId} className="admin-field-label" style={{ marginTop: '0.75rem' }}>
          {t('admin.contentRequests.nameTrLabel')}
        </label>
        <input
          id={nameTrId}
          type="text"
          className="admin-input"
          value={nameTr}
          onChange={(e) => setNameTr(e.target.value)}
          maxLength={200}
          disabled={busy}
        />

        <label htmlFor={descriptionEnId} className="admin-field-label" style={{ marginTop: '0.75rem' }}>
          {t('admin.contentRequests.descriptionEnLabel')}
        </label>
        <textarea
          id={descriptionEnId}
          className="admin-textarea"
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
          rows={3}
          maxLength={2000}
          disabled={busy}
        />

        <label htmlFor={descriptionTrId} className="admin-field-label" style={{ marginTop: '0.75rem' }}>
          {t('admin.contentRequests.descriptionTrLabel')}
        </label>
        <textarea
          id={descriptionTrId}
          className="admin-textarea"
          value={descriptionTr}
          onChange={(e) => setDescriptionTr(e.target.value)}
          rows={3}
          maxLength={2000}
          disabled={busy}
        />

        {type === 'variety' && (
          <>
            <label htmlFor={genreIdInputId} className="admin-field-label" style={{ marginTop: '0.75rem' }}>
              {t('admin.contentRequests.genreIdLabel')}
            </label>
            <input
              id={genreIdInputId}
              type="number"
              className="admin-input"
              value={genreId}
              onChange={(e) => setGenreId(e.target.value)}
              min={1}
              disabled={busy}
            />
          </>
        )}

        <label htmlFor={noteId} className="admin-field-label" style={{ marginTop: '0.75rem' }}>
          {t('admin.contentRequests.decisionNoteLabel')}
        </label>
        <textarea
          id={noteId}
          className="admin-textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('admin.contentRequests.decisionNotePlaceholder')}
          rows={3}
          maxLength={2000}
          disabled={busy}
        />
        <span className="admin-field-hint">
          {note.length}/2000 — {t('admin.contentRequests.decisionNoteOptional')}
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
            disabled={busy || !nameEn.trim()}
            aria-busy={busy}
          >
            {busy ? <span className="ui-spinner" aria-hidden /> : t('admin.contentRequests.approveConfirm')}
          </button>
        </div>
      </div>
    </div>
  )
}
