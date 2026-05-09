import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  title: string
  confirmLabel: string
  confirmVariant: 'primary' | 'danger'
  busy: boolean
  onCancel: () => void
  onSubmit: (decisionNote: string) => void
}

/** A small modal asking for an optional decision note before approve/reject. */
export function DecisionDialog({
  title,
  confirmLabel,
  confirmVariant,
  busy,
  onCancel,
  onSubmit,
}: Props) {
  const { t } = useTranslation('common')
  const titleId = useId()
  const fieldId = useId()
  const [note, setNote] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    textareaRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [busy, onCancel])

  return (
    <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="admin-modal__backdrop" onClick={() => (busy ? null : onCancel())} />
      <div className="admin-modal__panel" role="document">
        <h2 id={titleId} className="admin-modal__title">
          {title}
        </h2>

        <label htmlFor={fieldId} className="admin-field-label">
          {t('admin.requests.decisionNoteLabel')}
        </label>
        <textarea
          id={fieldId}
          ref={textareaRef}
          className="admin-textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('admin.requests.decisionNotePlaceholder')}
          rows={4}
          maxLength={2000}
          disabled={busy}
        />
        <span className="admin-field-hint">
          {note.length}/2000 — {t('admin.requests.decisionNoteOptional')}
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
            className={`admin-btn admin-btn--${confirmVariant}`}
            onClick={() => onSubmit(note.trim())}
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? <span className="ui-spinner" aria-hidden /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
