import { useEffect, useId, useRef } from 'react'
import './ConfirmModal.css'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  /** Use destructive styling for the confirm button. */
  confirmVariant?: 'danger' | 'primary'
  /** Disable actions (e.g. while a request runs). */
  busy?: boolean
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  confirmVariant = 'primary',
  busy = false,
}: ConfirmModalProps) {
  const titleId = useId()
  const descId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    cancelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) {
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onCancel, busy])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="confirm-modal-overlay"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="confirm-modal__title">
          {title}
        </h2>
        <p id={descId} className="confirm-modal__message">
          {message}
        </p>
        <div className="confirm-modal__actions">
          <button
            ref={cancelRef}
            type="button"
            className="confirm-modal__btn confirm-modal__btn--secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              confirmVariant === 'danger'
                ? 'confirm-modal__btn confirm-modal__btn--danger'
                : 'confirm-modal__btn confirm-modal__btn--primary'
            }
            onClick={onConfirm}
            disabled={busy}
            aria-busy={busy}
          >
            <span className="confirm-modal__btn-content">
              <span
                className={
                  busy
                    ? 'confirm-modal__btn-label confirm-modal__btn-label--hidden'
                    : 'confirm-modal__btn-label'
                }
              >
                {confirmLabel}
              </span>
              {busy && (
                <span className="confirm-modal__btn-spinner-wrap" aria-hidden>
                  <span className="ui-spinner confirm-modal__btn-spinner" />
                </span>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
