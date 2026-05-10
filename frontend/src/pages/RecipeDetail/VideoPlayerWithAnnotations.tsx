import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { VideoAnnotation } from '@/services/recipe-service'

export interface VideoPlayerWithAnnotationsProps {
  src: string
  annotations: VideoAnnotation[]
  ariaLabel: string
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function VideoPlayerWithAnnotations({
  src,
  annotations,
  ariaLabel,
}: VideoPlayerWithAnnotationsProps) {
  const { t } = useTranslation('common')
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)

  const handleLoadedMeta = useCallback(() => {
    const v = videoRef.current
    if (v && Number.isFinite(v.duration)) setDuration(v.duration)
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    const t = v.currentTime
    const current = annotations.find((a) => t >= a.startTime && t <= a.endTime)
    setActiveId(current?.id ?? null)
  }, [annotations])

  const seekTo = useCallback((seconds: number) => {
    const v = videoRef.current
    if (!v) return
    v.currentTime = seconds
    void v.play()
  }, [])

  useEffect(() => {
    setActiveId(null)
  }, [src])

  const sortedAnnotations = [...annotations].sort((a, b) => a.startTime - b.startTime)

  return (
    <div className="rd-video-player">
      <div className="rd-video-player__container">
        <video
          ref={videoRef}
          className="rd-video-player__video"
          controls
          playsInline
          preload="metadata"
          src={src}
          aria-label={ariaLabel}
          onLoadedMetadata={handleLoadedMeta}
          onTimeUpdate={handleTimeUpdate}
        />
        {duration > 0 && sortedAnnotations.length > 0 && (
          <div
            className="rd-video-player__markers"
            aria-hidden
          >
            {sortedAnnotations.map((a) => {
              const left = Math.max(0, Math.min(100, (a.startTime / duration) * 100))
              return (
                <button
                  key={a.id}
                  type="button"
                  className={`rd-video-player__marker${activeId === a.id ? ' rd-video-player__marker--active' : ''}`}
                  style={{ left: `${left}%` }}
                  onClick={() => seekTo(a.startTime)}
                  title={`${formatTime(a.startTime)} — ${a.note}`}
                  aria-label={`${formatTime(a.startTime)} ${a.note}`}
                />
              )
            })}
          </div>
        )}
      </div>

      {sortedAnnotations.length > 0 && (
        <ol className="rd-video-player__annotation-list">
          {sortedAnnotations.map((a) => (
            <li
              key={a.id}
              className={`rd-video-player__annotation${activeId === a.id ? ' rd-video-player__annotation--active' : ''}`}
            >
              <button
                type="button"
                className="rd-video-player__annotation-btn"
                onClick={() => seekTo(a.startTime)}
                aria-label={t('recipeDetail.videoAnnotations.seekAria', {
                  start: formatTime(a.startTime),
                  note: a.note,
                })}
              >
                <span className="rd-video-player__annotation-time">
                  {formatTime(a.startTime)}–{formatTime(a.endTime)}
                </span>
                <span className="rd-video-player__annotation-body">
                  {a.technique && (
                    <span className="rd-video-player__annotation-technique">{a.technique}</span>
                  )}
                  <span className="rd-video-player__annotation-note">{a.note}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
