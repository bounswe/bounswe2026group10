import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recipeService, type RecipeDetail } from '@/services/recipe-service'
import './RecipeDetailPage.css'

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export function RecipeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  const [recipe, setRecipe] = useState<RecipeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    recipeService
      .getById(id)
      .then(setRecipe)
      .catch(() => setError(t('common.errorRetry')))
      .finally(() => setLoading(false))
  }, [id, t])

  if (loading) {
    return (
      <div className="recipe-detail">
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

  const coverImage = recipe.media.find((m) => m.type === 'image')
  const rating = recipe.averageRating

  return (
    <div className="recipe-detail">

      {/* ── Back button ──────────────────────────────────────────────── */}
      <button type="button" className="recipe-detail__back" onClick={() => navigate(-1)}>
        <BackIcon />
        {t('common.goBack')}
      </button>

      {/* ── Cover image ──────────────────────────────────────────────── */}
      <div className="recipe-detail__cover">
        {coverImage ? (
          <img src={coverImage.url} alt={recipe.title} loading="lazy" />
        ) : (
          <div className="recipe-detail__cover-placeholder" />
        )}
        <span className={`recipe-detail__type-badge recipe-detail__type-badge--${recipe.type}`}>
          {recipe.type === 'cultural' ? t('recipeDetail.cultural') : t('recipeDetail.community')}
        </span>
      </div>

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="recipe-detail__header">
        <h1 className="recipe-detail__title">{recipe.title}</h1>

        <div className="recipe-detail__meta">
          {recipe.creatorUsername && (
            <span className="recipe-detail__author">{t('recipeDetail.by')} {recipe.creatorUsername}</span>
          )}
          {rating !== null && (
            <span className="recipe-detail__rating">
              <StarIcon />
              {rating.toFixed(1)}
              <span className="recipe-detail__rating-count">({recipe.ratingCount})</span>
            </span>
          )}
        </div>

        <div className="recipe-detail__tags">
          {recipe.genreName && (
            <span className="recipe-detail__tag">{recipe.genreName}</span>
          )}
          {recipe.dishVarietyName && (
            <span className="recipe-detail__tag recipe-detail__tag--variety">{recipe.dishVarietyName}</span>
          )}
          {recipe.servingSize && (
            <span className="recipe-detail__tag">
              {t('recipeDetail.servings', { count: recipe.servingSize })}
            </span>
          )}
        </div>
      </div>

      {/* ── Story ────────────────────────────────────────────────────── */}
      {recipe.story && (
        <section className="recipe-detail__section">
          <h2 className="recipe-detail__section-title">{t('recipeDetail.story')}</h2>
          <p className="recipe-detail__story">{recipe.story}</p>
        </section>
      )}

      {/* ── Ingredients ──────────────────────────────────────────────── */}
      {recipe.ingredients.length > 0 && (
        <section className="recipe-detail__section">
          <h2 className="recipe-detail__section-title">{t('recipeDetail.ingredients')}</h2>
          <ul className="recipe-detail__ingredients">
            {recipe.ingredients.map((ing) => (
              <li key={ing.id} className="recipe-detail__ingredient">
                <span className="recipe-detail__ingredient-name">{ing.ingredientName ?? t('recipeDetail.unknownIngredient')}</span>
                <span className="recipe-detail__ingredient-amount">{ing.quantity} {ing.unit}</span>
                {ing.allergens.length > 0 && (
                  <span className="recipe-detail__allergens">
                    ⚠ {ing.allergens.join(', ')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Tools ────────────────────────────────────────────────────── */}
      {recipe.tools.length > 0 && (
        <section className="recipe-detail__section">
          <h2 className="recipe-detail__section-title">{t('recipeDetail.tools')}</h2>
          <ul className="recipe-detail__tools">
            {recipe.tools.map((tool) => (
              <li key={tool.id} className="recipe-detail__tool">{tool.name}</li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Steps ────────────────────────────────────────────────────── */}
      {recipe.steps.length > 0 && (
        <section className="recipe-detail__section">
          <h2 className="recipe-detail__section-title">{t('recipeDetail.instructions')}</h2>
          <ol className="recipe-detail__steps">
            {recipe.steps.map((step) => (
              <li key={step.id} className="recipe-detail__step">
                <span className="recipe-detail__step-num">{step.stepOrder}</span>
                <p className="recipe-detail__step-desc">{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ── Video ────────────────────────────────────────────────────── */}
      {recipe.videoUrl && (
        <section className="recipe-detail__section">
          <h2 className="recipe-detail__section-title">{t('recipeDetail.video')}</h2>
          <a
            href={recipe.videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="recipe-detail__video-link"
          >
            {t('recipeDetail.watchVideo')}
          </a>
        </section>
      )}

    </div>
  )
}
