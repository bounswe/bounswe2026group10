import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { RecipeCard } from '@/components/UiComponents/RecipeCard'
import { discoveryService, type DishVarietyDetail, type RecipeSummary, type VarietyRecipeSummary } from '@/services/discovery-service'
import { recipeService } from '@/services/recipe-service'
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

function RecipeSpotlight({
  recipe,
  description,
  imageUrl,
  onClick,
}: {
  recipe: VarietyRecipeSummary
  description: string | null
  imageUrl: string | null
  onClick: () => void
}) {
  const { t } = useTranslation('common')

  return (
    <article className="variety-recipe-spotlight" aria-label={t('dishVariety.culturalSpotlight')}>
      {imageUrl && (
        <div className="variety-recipe-spotlight__media">
          <img src={imageUrl} alt={recipe.title} loading="lazy" />
        </div>
      )}

      <div className="variety-recipe-spotlight__eyebrow">{t('dishVariety.culturalSpotlight')}</div>
      <h3 className="variety-recipe-spotlight__title">{recipe.title}</h3>

      <div className="variety-recipe-spotlight__meta">
        <span className="variety-recipe-spotlight__type">{t('recipeDetail.cultural')}</span>
        {recipe.region && <span>{recipe.region}</span>}
        {recipe.averageRating !== null && (
          <span className="variety-recipe-spotlight__rating">
            <StarIcon />
            {recipe.averageRating.toFixed(1)}
            <small>({recipe.ratingCount})</small>
          </span>
        )}
        {recipe.createdAt && (
          <span>
            {t('dishVariety.publishedOn', {
              date: new Date(recipe.createdAt).toLocaleDateString(),
            })}
          </span>
        )}
      </div>

      <p className="variety-recipe-spotlight__description">
        {description?.trim() || t('dishVariety.noDescription')}
      </p>

      <button type="button" className="variety-recipe-spotlight__cta" onClick={onClick}>
        {t('dishVariety.openRecipe')}
      </button>
    </article>
  )
}

export function DishVarietyPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation('common')

  const [variety, setVariety] = useState<DishVarietyDetail | null>(null)
  const [featuredDescription, setFeaturedDescription] = useState<string | null>(null)
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null)
  const [communityImageMap, setCommunityImageMap] = useState<Record<string, string | null>>({})
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

  useEffect(() => {
    const culturalRecipeId = variety?.recipes.find((recipe) => recipe.type === 'cultural')?.id
    if (!culturalRecipeId) {
      setFeaturedDescription(null)
      setFeaturedImageUrl(null)
      return
    }

    let cancelled = false
    recipeService
      .getById(culturalRecipeId)
      .then((recipe) => {
        if (!cancelled) {
          setFeaturedDescription(recipe.story ?? null)
          const firstImage = recipe.media.find((item) => item.type === 'image')
          setFeaturedImageUrl(firstImage?.url ?? null)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFeaturedDescription(null)
          setFeaturedImageUrl(null)
        }
      })

    return () => {
      cancelled = true
    }
  }, [variety?.recipes])

  useEffect(() => {
    const communityIds =
      variety?.recipes.filter((recipe) => recipe.type === 'community').map((recipe) => recipe.id) ?? []

    if (communityIds.length === 0) {
      setCommunityImageMap({})
      return
    }

    let cancelled = false

    Promise.all(
      communityIds.map(async (recipeId) => {
        try {
          const detail = await recipeService.getById(recipeId)
          const firstImage = detail.media.find((item) => item.type === 'image')
          return [recipeId, firstImage?.url ?? null] as const
        } catch {
          return [recipeId, null] as const
        }
      }),
    ).then((entries) => {
      if (cancelled) return
      setCommunityImageMap(Object.fromEntries(entries))
    })

    return () => {
      cancelled = true
    }
  }, [variety?.recipes])

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

  const culturalRecipe = variety.recipes.find((recipe) => recipe.type === 'cultural') ?? null
  const communityRecipes = variety.recipes.filter((recipe) => recipe.type === 'community')

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
          <>
            {culturalRecipe && (
              <RecipeSpotlight
                recipe={culturalRecipe}
                description={featuredDescription}
                imageUrl={featuredImageUrl}
                onClick={() => navigate(`/recipes/${culturalRecipe.id}`)}
              />
            )}

            {communityRecipes.length > 0 ? (
              <>
                <h3 className="dish-variety-page__subsection-title">{t('dishVariety.communityRecipes')}</h3>
                <div className="dish-variety-page__recipes">
                  {communityRecipes.map((r) => (
                    <RecipeCard
                      key={r.id}
                      recipe={{
                        id: r.id,
                        title: r.title,
                        recipeType: 'community',
                        averageRating: r.averageRating ?? undefined,
                        ratingCount: r.ratingCount,
                        createdAt: r.createdAt,
                        imageUrl: communityImageMap[r.id] ?? undefined,
                        author: { username: 'Community' },
                        region: r.region ?? undefined,
                      } as RecipeSummary}
                      variant="horizontal"
                      onClick={() => navigate(`/recipes/${r.id}`)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="dish-variety-page__empty">{t('dishVariety.noCommunityRecipes')}</p>
            )}
          </>
        )}
      </section>

    </div>
  )
}
