import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { RecipeStep } from '@/services/recipe-service'

export interface VideoGuideModalProps {
  videoUrl: string
  steps: RecipeStep[]
  onClose: () => void
}

function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

export function VideoGuideModal({ videoUrl, steps, onClose }: VideoGuideModalProps) {
  const { t } = useTranslation('common')
  const [currentIndex, setCurrentIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  const totalSteps = steps.length
  const currentStep = steps[currentIndex]

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'ArrowLeft') goPrevious()
    }
    window.addEventListener('keydown', handleKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, totalSteps])

  // Seek the video to the per-step timestamp whenever the step changes.
  useEffect(() => {
    const v = videoRef.current
    if (!v || !currentStep) return
    const ts = currentStep.videoTimestamp
    if (typeof ts === 'number' && Number.isFinite(ts) && ts >= 0) {
      const apply = () => {
        try {
          v.currentTime = ts
          void v.play()
        } catch {
          /* user-gesture restriction; ignore */
        }
      }
      if (v.readyState >= 1) apply()
      else v.addEventListener('loadedmetadata', apply, { once: true })
    }
  }, [currentStep])

  function goNext() {
    if (currentIndex < totalSteps - 1) setCurrentIndex((i) => i + 1)
    else onClose()
  }

  function goPrevious() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1)
  }

  const isFirst = currentIndex === 0
  const isLast = currentIndex === totalSteps - 1
  const progressPct = totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0

  return (
    <div
      className="vg-modal"
      role="dialog"
      aria-modal="true"
      aria-label={t('recipeDetail.videoGuide.title')}
    >
      <div className="vg-modal__progress">
        <button
          type="button"
          className="vg-modal__close"
          onClick={onClose}
          aria-label={t('recipeDetail.videoGuide.closeAria')}
        >
          <IconClose />
        </button>
        <div className="vg-modal__bar">
          <div className="vg-modal__bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
        <span className="vg-modal__counter">
          {currentIndex + 1}/{totalSteps}
        </span>
      </div>

      <div className="vg-modal__stage">
        {videoUrl ? (
          <video
            ref={videoRef}
            className="vg-modal__video"
            src={videoUrl}
            controls
            playsInline
            preload="metadata"
            aria-label={t('recipeDetail.videoPlayerAria')}
          />
        ) : (
          <div className="vg-modal__placeholder">
            {t('recipeDetail.videoGuide.noVideo')}
          </div>
        )}

        {currentStep && (
          <div className="vg-modal__step-info">
            <div className="vg-modal__step-num">{currentStep.stepOrder}</div>
            <p className="vg-modal__step-desc">{currentStep.description}</p>
          </div>
        )}
      </div>

      <div className="vg-modal__nav">
        <button
          type="button"
          className="vg-modal__nav-btn vg-modal__nav-btn--prev"
          onClick={goPrevious}
          disabled={isFirst}
        >
          <IconChevronLeft />
          <span>{t('recipeDetail.videoGuide.previous')}</span>
        </button>
        <button
          type="button"
          className="vg-modal__nav-btn vg-modal__nav-btn--next"
          onClick={goNext}
        >
          <span>
            {isLast ? t('recipeDetail.videoGuide.finish') : t('recipeDetail.videoGuide.next')}
          </span>
          <IconChevronRight />
        </button>
      </div>
    </div>
  )
}
