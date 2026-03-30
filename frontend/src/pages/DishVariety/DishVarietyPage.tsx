import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { discoveryService, type DishVarietyDetail, type VarietyRecipeSummary } from '@/services/discovery-service'
import './DishVarietyPage.css'

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function RecipeRow({ recipe, onClick }: { recipe: VarietyRecipeSummary; onClick: () => void }) {
  const { t } = useTranslation('common')
  return (
    <button type="button" className="variety-recipe-row" onClick={onClick}>
      <div className="variety-recipe-row__body">
        <h3 className="variety-recipe-row__title">{recipe.title}</h3>
        <div className="variety-recipe-row__meta">
          <span className={`variety-recipe-row__type variety-recipe-row__type--${recipe.type}`}>
            {recipe.type === 'cultural' ? t('recipeDetail.cultural') : t('recipeDetail.community')}
          </span>
          {recipe.region && (
            <span className="variety-recipe-row__region">{recipe.region}</span>
          )}
          {recipe.averageRating !== null && (
            <span className="variety-recipe-row__rating">
              <StarIcon />
              {recipe.averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="variety-recipe-row__arrow">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  )
}

export function DishVarietyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  const [variety, setVariety] = useState<DishVarietyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    discoveryService
      .getVarietyById(id)
      .then(setVariety)
      .catch(() => setError(t('common.errorRetry')))
      .finally(() => setLoading(false))
  }, [id, t])

  if (loading) {
    return (
      <div className="dish-variety-page">
        <div className="dish-variety-page__skeleton-title skeleton-pulse" />
        <div className="dish-variety-page__skeleton-body">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dish-variety-page__skeleton-row skeleton-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !variety) {
    return (
      <div className="dish-variety-page dish-variety-page--error">
        <p>{error ?? t('dishVariety.notFound')}</p>
        <button type="button" className="dish-variety-page__back-btn" onClick={() => navigate(-1)}>
          {t('common.goBack')}
        </button>
      </div>
    )
  }

  return (
    <div className="dish-variety-page">

      {/* ── Back ──────────────────────────────────────────────────────── */}
      <button type="button" className="dish-variety-page__back" onClick={() => navigate(-1)}>
        <BackIcon />
        {t('common.goBack')}
      </button>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="dish-variety-page__header">
        {variety.genre && (
          <span className="dish-variety-page__genre">{variety.genre.name}</span>
        )}
        <h1 className="dish-variety-page__title">{variety.name}</h1>
        {variety.description && (
          <p className="dish-variety-page__description">{variety.description}</p>
        )}
      </div>

      {/* ── Recipes ───────────────────────────────────────────────────── */}
      <section className="dish-variety-page__section">
        <h2 className="dish-variety-page__section-title">
          {t('dishVariety.recipes', { count: variety.recipes.length })}
        </h2>

        {variety.recipes.length === 0 ? (
          <p className="dish-variety-page__empty">{t('dishVariety.noRecipes')}</p>
        ) : (
          <div className="dish-variety-page__recipes">
            {variety.recipes.map((r) => (
              <RecipeRow
                key={r.id}
                recipe={r}
                onClick={() => navigate(`/recipes/${r.id}`)}
              />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}
