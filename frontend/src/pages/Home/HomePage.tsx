import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { discoveryService, type Genre, type RecipeSummary } from '@/services/discovery-service'
import { RecipeCard } from '@/components/UiComponents/RecipeCard'
import { GenreCard } from '@/components/UiComponents/GenreCard'
import './HomePage.css'

export function HomePage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [totalRecipes, setTotalRecipes] = useState(0)
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      discoveryService.getRecipeResults({ limit: 10, page: 1 }),
      discoveryService.getGenres(),
    ])
      .then(([recipeResults, g]) => {
        if (cancelled) return
        setRecipes(recipeResults.recipes)
        setTotalRecipes(recipeResults.pagination.total)
        setGenres(g)
      })
      .catch(() => {
        if (!cancelled) setError(t('common.errorRetry'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [t])

  const featured = recipes[0] ?? null
  const picks = recipes.slice(1, 4)

  const handleExploreDiscovery = () => {
    navigate('/discovery')
  }

  const handleSearchRecipes = () => {
    navigate('/search')
  }

  if (loading) {
    return (
      <div className="home-page">
        <div className="home-page__skeleton-hero skeleton-pulse" />
        <div className="home-page__skeleton-row">
          {[1, 2, 3].map((i) => <div key={i} className="home-page__skeleton-card skeleton-pulse" />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="home-page home-page--error">
        <p>{error}</p>
        <button type="button" className="home-page__retry" onClick={() => window.location.reload()}>
          {t('common.retry')}
        </button>
      </div>
    )
  }

  return (
    <div className="home-page">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="home-page__hero">
        <div className="home-page__hero-copy">
          <span className="home-page__featured-label">{t('home.heroKicker')}</span>
          <h1 className="home-page__hero-title">{t('home.heroTitle')}</h1>
          <p className="home-page__hero-subtitle">{t('home.heroSubtitle')}</p>
          <div className="home-page__hero-actions">
            <button type="button" className="home-page__hero-btn home-page__hero-btn--primary" onClick={handleExploreDiscovery}>
              {t('home.exploreDiscovery')}
            </button>
            <button type="button" className="home-page__hero-btn home-page__hero-btn--secondary" onClick={handleSearchRecipes}>
              {t('home.searchRecipes')}
            </button>
          </div>
          <div className="home-page__hero-stats">
            <div className="home-page__stat">
              <span className="home-page__stat-value">{genres.length}</span>
              <span className="home-page__stat-label">{t('home.heroGenres')}</span>
            </div>
            <div className="home-page__stat">
              <span className="home-page__stat-value">{totalRecipes}</span>
              <span className="home-page__stat-label">{t('home.heroRecipes')}</span>
            </div>
            <div className="home-page__stat">
              <span className="home-page__stat-value">{picks.length}</span>
              <span className="home-page__stat-label">{t('home.heroPicks')}</span>
            </div>
          </div>
        </div>

        <div className="home-page__hero-feature">
          <span className="home-page__section-eyebrow">{t('home.featured')}</span>
          {featured ? (
            <RecipeCard
              recipe={featured}
              variant="hero"
              onClick={() => navigate(`/recipes/${featured.id}`)}
            />
          ) : (
            <p className="home-page__empty">{t('home.noRecipes')}</p>
          )}
        </div>
      </section>

      {/* ── Community Picks ─────────────────────────────────────────────── */}
      {picks.length > 0 && (
        <section className="home-page__section">
          <div className="home-page__section-header">
            <div>
              <span className="home-page__section-eyebrow">{t('home.communityPicks')}</span>
              <h2 className="home-page__section-title">{t('home.communityPicks')}</h2>
              <p className="home-page__section-copy">{t('home.communityPicksSubtitle')}</p>
            </div>
          </div>
          <div className="home-page__picks-grid">
            {picks.map((r) => (
              <RecipeCard
                key={r.id}
                recipe={r}
                variant="horizontal"
                onClick={() => navigate(`/recipes/${r.id}`)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ── Browse by Genre ─────────────────────────────────────────────── */}
      {genres.length > 0 && (
        <section className="home-page__section">
          <div className="home-page__section-header">
            <div>
              <span className="home-page__section-eyebrow">{t('home.browseByGenre')}</span>
              <h2 className="home-page__section-title">{t('home.browseByGenre')}</h2>
              <p className="home-page__section-copy">{t('home.browseByGenreSubtitle')}</p>
            </div>
            <button type="button" className="home-page__section-link" onClick={handleExploreDiscovery}>
              {t('home.exploreDiscovery')}
            </button>
          </div>
          <div className="home-page__genre-grid">
            {genres.map((g) => (
              <GenreCard
                key={g.id}
                genre={g}
                onClick={() => navigate(`/discovery?genreId=${g.id}`)}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
