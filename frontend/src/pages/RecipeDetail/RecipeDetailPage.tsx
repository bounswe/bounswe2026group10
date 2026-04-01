import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { recipeService, type RecipeDetail, type RecipeIngredient } from '@/services/recipe-service'
import { ratingService } from '@/services/rating-service'
import { RecipeRating } from '@/components/RecipeRating/RecipeRating'
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal'
import { useAppSelector } from '@/store/hooks'
import './RecipeDetailPage.css'

function IconBack() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path
        fill={filled ? 'currentColor' : 'none'}
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  )
}

function IconShare() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function IconStar({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function IconChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function IconRefresh() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}

function scaledAmount(ing: RecipeIngredient, baseServings: number, servings: number): string {
  const q = ing.quantity
  const u = ing.unit
  if (baseServings <= 0) return `${q} ${u}`
  const v = (q * servings) / baseServings
  const rounded = Number.isInteger(v) ? v : Math.round(v * 100) / 100
  return `${rounded} ${u}`
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [servings, setServings] = useState(4)
  const [favorited, setFavorited] = useState(false)
  const [myRatingScore, setMyRatingScore] = useState<number | null>(null)
  const [ratingBusy, setRatingBusy] = useState(false)
  const [ratingError, setRatingError] = useState<string | null>(null)
  const [showRemoveRatingModal, setShowRemoveRatingModal] = useState(false)

  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const profile = useAppSelector((s) => s.profile)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    recipeService
      .getById(id)
      .then(setRecipe)
      .catch(() => setError(t('common.errorRetry')))
      .finally(() => setLoading(false))
  }, [id, t])

  /** Own recipe: `GET /auth/me` has no `profileId`; match creator username (same as backend profile ownership). */
  const isOwnRecipe =
    !!recipe?.creatorUsername &&
    profile.status === 'succeeded' &&
    !!profile.username &&
    profile.username === recipe.creatorUsername

  useEffect(() => {
    if (!id || !recipe || !isAuthenticated) {
      if (!isAuthenticated) {
        setMyRatingScore(null)
      }
      return
    }
    if (profile.status === 'loading' || profile.status === 'idle') {
      return
    }
    if (profile.status === 'succeeded' && isOwnRecipe) {
      setMyRatingScore(null)
      return
    }
    let cancelled = false
    ratingService
      .getMyRating(id)
      .then((r) => {
        if (!cancelled) {
          setMyRatingScore(r?.score ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setMyRatingScore(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [id, recipe, isAuthenticated, isOwnRecipe, profile.status])

  useEffect(() => {
    if (!recipe) return
    const b = recipe.servingSize && recipe.servingSize > 0 ? recipe.servingSize : 4
    setServings(b)
  }, [recipe])

  const handleRecipeRatingChange = useCallback(
    async (score: number) => {
      if (!id || !recipe) {
        return
      }
      setRatingError(null)
      setRatingBusy(true)
      try {
        await ratingService.submitRating(id, score)
        const updated = await recipeService.getById(id)
        setRecipe(updated)
        setMyRatingScore(score)
      } catch (err: unknown) {
        const message = isAxiosError(err)
          ? (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message
          : undefined
        setRatingError(message || t('recipeDetail.ratingSubmitError'))
      } finally {
        setRatingBusy(false)
      }
    },
    [id, recipe, t]
  )

  const handleRemoveMyRating = useCallback(async (): Promise<boolean> => {
    if (!id || !recipe) {
      return false
    }
    setRatingError(null)
    setRatingBusy(true)
    try {
      await ratingService.deleteMyRating(id)
      const updated = await recipeService.getById(id)
      setRecipe(updated)
      setMyRatingScore(null)
      return true
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message
        : undefined
      setRatingError(message || t('recipeDetail.ratingSubmitError'))
      return false
    } finally {
      setRatingBusy(false)
    }
  }, [id, recipe, t])

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    try {
      if (navigator.share && recipe) {
        await navigator.share({ title: recipe.title, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch {
      /* user cancelled or clipboard denied */
    }
  }

  if (loading) {
    return (
      <div className="recipe-detail recipe-detail--loading">
        <div className="recipe-detail__skeleton-hero skeleton-pulse" />
        <div className="recipe-detail__skeleton-body">
          {[1, 2, 3].map((i) => (
            <div key={i} className="recipe-detail__skeleton-line skeleton-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="recipe-detail recipe-detail--error">
        <p>{error ?? t('recipeDetail.notFound')}</p>
        <button type="button" className="recipe-detail__back-btn" onClick={() => navigate(-1)}>
          {t('common.goBack')}
        </button>
      </div>
    )
  }

  const imageMedia = recipe.media.filter((m) => m.type === 'image')
  const coverImage = imageMedia[0]
  const extraGalleryImages = imageMedia.slice(1)
  const uploadedVideos = recipe.media.filter((m) => m.type === 'video')
  const rating = recipe.averageRating
  const baseServings = recipe.servingSize && recipe.servingSize > 0 ? recipe.servingSize : 4
  const regionLine = recipe.dishVarietyName ?? recipe.genreName ?? ''
  const authorInitial = (recipe.creatorUsername ?? '?').slice(0, 1).toUpperCase()
  const badgeLabel = recipe.type === 'cultural' ? t('recipeDetail.cultural') : t('recipeDetail.community')

  return (
    <div className="recipe-detail">
      {/* Hero — web-design: full-bleed image + gradient + overlay toolbar */}
      <div className="recipe-detail__hero">
        {coverImage ? (
          <img src={coverImage.url} alt={recipe.title} className="recipe-detail__hero-img" loading="lazy" />
        ) : (
          <div className="recipe-detail__hero-placeholder" />
        )}
        <div className="recipe-detail__hero-gradient" aria-hidden />

        <div className="recipe-detail__hero-toolbar">
          <button
            type="button"
            className="recipe-detail__hero-btn"
            onClick={() => navigate(-1)}
            aria-label={t('common.goBack')}
          >
            <IconBack />
          </button>
          <div className="recipe-detail__hero-actions">
            <button
              type="button"
              className="recipe-detail__hero-btn"
              onClick={() => setFavorited((v) => !v)}
              aria-pressed={favorited}
              aria-label={t('recipeDetail.favoriteAria')}
            >
              <IconHeart filled={favorited} />
            </button>
            <button type="button" className="recipe-detail__hero-btn" onClick={() => void handleShare()} aria-label={t('recipeDetail.shareAria')}>
              <IconShare />
            </button>
          </div>
        </div>

        <div className={`recipe-detail__hero-badge recipe-detail__hero-badge--${recipe.type}`}>
          {badgeLabel}
        </div>
      </div>

      <div className="recipe-detail__body">
        <div className="recipe-detail__intro">
          <h1 className="recipe-detail__title">{recipe.title}</h1>

          {recipe.creatorUsername && (
            <div className="recipe-detail__author-block">
              <div className="recipe-detail__author-avatar" aria-hidden>
                {authorInitial}
              </div>
              <div>
                <p className="recipe-detail__author-name">{recipe.creatorUsername}</p>
                {regionLine && <p className="recipe-detail__author-meta">{regionLine}</p>}
              </div>
            </div>
          )}

          {recipe.story && (
            <p className="recipe-detail__lede">{recipe.story}</p>
          )}
        </div>

        {extraGalleryImages.length > 0 && (
          <section className="recipe-detail__block recipe-detail__media-gallery-wrap" aria-label={t('recipeDetail.mediaGallery')}>
            <h2 className="recipe-detail__h2">{t('recipeDetail.mediaGallery')}</h2>
            <div className="recipe-detail__media-gallery">
              {extraGalleryImages.map((m, i) => (
                <div key={m.id} className="recipe-detail__media-gallery-item">
                  <img
                    src={m.url}
                    alt={t('recipeDetail.galleryImageAlt', { n: i + 2 })}
                    className="recipe-detail__media-gallery-img"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {(rating !== null || recipe.ratingCount > 0) && (
          <div className="recipe-detail__stats">
            {rating !== null && (
              <div className="recipe-detail__stat-rating">
                <span className="recipe-detail__stat-star"><IconStar /></span>
                <span className="recipe-detail__stat-value">{rating.toFixed(1)}</span>
                <span className="recipe-detail__stat-reviews">({recipe.ratingCount})</span>
              </div>
            )}
          </div>
        )}

        <div className="recipe-detail__rating-section">
          <p className="recipe-detail__rating-label">
            {isAuthenticated ? t('recipeDetail.yourRating') : t('recipeDetail.ratingHeading')}
          </p>
          {!isAuthenticated && (
            <p className="recipe-detail__rating-muted">
              {t('recipeDetail.ratingLoginPrompt')}{' '}
              <Link to="/login" className="recipe-detail__rating-login">
                {t('recipeDetail.ratingLoginLink')}
              </Link>
            </p>
          )}
          {isAuthenticated && (profile.status === 'loading' || profile.status === 'idle') ? (
            <span className="ui-spinner" aria-hidden />
          ) : null}
          {isAuthenticated && profile.status === 'succeeded' && isOwnRecipe ? (
            <p className="recipe-detail__rating-muted">{t('recipeDetail.ratingOwnRecipe')}</p>
          ) : null}
          {isAuthenticated &&
          ((profile.status === 'succeeded' && !isOwnRecipe) || profile.status === 'failed') ? (
            <>
              <div className="recipe-detail__rating-controls">
                <RecipeRating
                  value={myRatingScore}
                  onChange={handleRecipeRatingChange}
                  busy={ratingBusy}
                  ariaLabel={t('recipeDetail.ratingAria')}
                  starSize={32}
                  size="comfortable"
                  className="recipe-detail__rating-stars"
                />
                {myRatingScore != null && (
                  <button
                    type="button"
                    className="recipe-detail__rating-remove"
                    onClick={() => setShowRemoveRatingModal(true)}
                    disabled={ratingBusy}
                    aria-label={t('recipeDetail.ratingRemoveAria')}
                  >
                    {t('recipeDetail.ratingRemove')}
                  </button>
                )}
              </div>
              {ratingError ? <p className="recipe-detail__rating-error">{ratingError}</p> : null}
            </>
          ) : null}
        </div>

        <div className="recipe-detail__card recipe-detail__servings-card">
          <div className="recipe-detail__servings-row">
            <div className="recipe-detail__servings-label">
              <span className="recipe-detail__servings-icon"><IconUsers /></span>
              <span>{t('recipeDetail.servingsLabel')}</span>
            </div>
            <div className="recipe-detail__servings-controls">
              <button
                type="button"
                className="recipe-detail__servings-btn"
                onClick={() => setServings((s) => Math.max(1, s - 1))}
                aria-label="Decrease servings"
              >
                −
              </button>
              <span className="recipe-detail__servings-value">{servings}</span>
              <button type="button" className="recipe-detail__servings-btn" onClick={() => setServings((s) => s + 1)} aria-label="Increase servings">
                +
              </button>
            </div>
          </div>
        </div>

        {recipe.ingredients.length > 0 && (
          <section className="recipe-detail__block">
            <h2 className="recipe-detail__h2">{t('recipeDetail.ingredients')}</h2>
            <ul className="recipe-detail__ingredient-list">
              {recipe.ingredients.map((ing) => (
                <li key={ing.id} className="recipe-detail__ingredient-card">
                  <div className="recipe-detail__ingredient-row">
                    <span className="recipe-detail__ingredient-name">{ing.ingredientName ?? t('recipeDetail.unknownIngredient')}</span>
                    <div className="recipe-detail__ingredient-right">
                      <span className="recipe-detail__ingredient-amt">{scaledAmount(ing, baseServings, servings)}</span>
                      <button
                        type="button"
                        className="recipe-detail__substitute-btn"
                        aria-label={t('recipeDetail.substituteAria', { name: ing.ingredientName ?? '' })}
                        title={t('recipeDetail.substituteAria', { name: ing.ingredientName ?? '' })}
                        onClick={() => {
                          /* placeholder — backend / modal later */
                        }}
                      >
                        <IconRefresh />
                      </button>
                    </div>
                  </div>
                  {ing.allergens.length > 0 && (
                    <p className="recipe-detail__ingredient-allergens">⚠ {ing.allergens.join(', ')}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {recipe.tools.length > 0 && (
          <section className="recipe-detail__block">
            <h2 className="recipe-detail__h2">{t('recipeDetail.tools')}</h2>
            <div className="recipe-detail__tools-row">
              {recipe.tools.map((tool) => (
                <span key={tool.id} className="recipe-detail__tool-pill">
                  {tool.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {recipe.steps.length > 0 && (
          <section className="recipe-detail__block">
            <h2 className="recipe-detail__h2">{t('recipeDetail.instructions')}</h2>
            <ol className="recipe-detail__step-list">
              {recipe.steps.map((step) => (
                <li key={step.id} className="recipe-detail__step-card">
                  <span className="recipe-detail__step-num">{step.stepOrder}</span>
                  <p className="recipe-detail__step-text">{step.description}</p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {uploadedVideos.length > 0 && (
          <section className="recipe-detail__block">
            <h2 className="recipe-detail__h2">{t('recipeDetail.video')}</h2>
            <div className="recipe-detail__uploaded-videos">
              {uploadedVideos.map((m) => (
                <video
                  key={m.id}
                  className="recipe-detail__uploaded-video"
                  controls
                  playsInline
                  preload="metadata"
                  src={m.url}
                >
                  {t('recipeDetail.video')}
                </video>
              ))}
            </div>
          </section>
        )}

        <button type="button" className="recipe-detail__row-btn" onClick={() => { /* comments route later */ }}>
          <span>{t('recipeDetail.commentsRatings', { count: recipe.ratingCount })}</span>
          <IconChevronRight />
        </button>

        <button type="button" className="recipe-detail__cta" onClick={() => { /* cooking mode later */ }}>
          {t('recipeDetail.startCookingMode')}
        </button>

        <section className="recipe-detail__block recipe-detail__alternatives">
          <h2 className="recipe-detail__h2">{t('recipeDetail.alternativeRecipes')}</h2>
          <p className="recipe-detail__alternatives-empty">{t('recipeDetail.noAlternatives')}</p>
        </section>
      </div>

      <ConfirmModal
        isOpen={showRemoveRatingModal}
        title={t('recipeDetail.ratingRemoveModalTitle')}
        message={t('recipeDetail.ratingRemoveModalMessage')}
        confirmLabel={t('recipeDetail.ratingRemoveModalConfirm')}
        cancelLabel={t('recipeDetail.ratingRemoveModalCancel')}
        confirmVariant="danger"
        busy={ratingBusy}
        onCancel={() => setShowRemoveRatingModal(false)}
        onConfirm={() => {
          void (async () => {
            const ok = await handleRemoveMyRating()
            if (ok) {
              setShowRemoveRatingModal(false)
            }
          })()
        }}
      />
    </div>
  )
}
