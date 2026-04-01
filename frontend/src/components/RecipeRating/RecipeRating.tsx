import { useState } from 'react'
import './RecipeRating.css'

const STARS = [1, 2, 3, 4, 5] as const

export interface RecipeRatingProps {
  /** Selected rating 1–5, or `null` if none. */
  value: number | null
  /** Called when the user picks a star (1–5). Ignored when `readOnly` or `disabled`. */
  onChange?: (score: number) => void
  disabled?: boolean
  /** Show stars only; no hover or clicks. */
  readOnly?: boolean
  /** Loading state after submit; stars not clickable. */
  busy?: boolean
  /** `role="group"` label for the interactive control. */
  ariaLabel?: string
  className?: string
  /** Pixel size for each star icon. */
  starSize?: number
}

function StarGlyph({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`recipe-rating__svg${filled ? ' recipe-rating__svg--filled' : ''}`}
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function RecipeRating({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  busy = false,
  ariaLabel = 'Star rating',
  className = '',
  starSize = 28,
}: RecipeRatingProps) {
  const [hover, setHover] = useState<number | null>(null)

  const preview = readOnly ? (value ?? 0) : (hover ?? value ?? 0)
  const isInteractive = !readOnly && !disabled && !busy

  const rootClass = [
    'recipe-rating',
    busy && 'recipe-rating--busy',
    disabled && 'recipe-rating--disabled',
    readOnly && 'recipe-rating--readonly',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (readOnly) {
    const label =
      value != null && value >= 1 ? `Rated ${value} out of 5 stars` : 'No rating'
    return (
      <div className={rootClass} role="img" aria-label={label}>
        <div className="recipe-rating__stars">
          {STARS.map((n) => (
            <span key={n} className="recipe-rating__star recipe-rating__star--static">
              <StarGlyph filled={n <= preview} size={starSize} />
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={rootClass}
      role="group"
      aria-label={ariaLabel}
      aria-busy={busy || undefined}
    >
      {busy ? (
        <span className="recipe-rating__busy-overlay" aria-hidden>
          <span className="ui-spinner" />
        </span>
      ) : null}
      <div className="recipe-rating__stars">
        {STARS.map((n) => {
          const filled = n <= preview
          return (
            <button
              key={n}
              type="button"
              className="recipe-rating__star"
              disabled={disabled || busy}
              onClick={() => {
                if (isInteractive && onChange) {
                  onChange(n)
                }
              }}
              onMouseEnter={() => isInteractive && setHover(n)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => isInteractive && setHover(n)}
              onBlur={() => setHover(null)}
              aria-label={`${n} out of 5 stars`}
            >
              <StarGlyph filled={filled} size={starSize} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
