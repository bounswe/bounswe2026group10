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
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    Promise.all([
      discoveryService.getRecipes({ limit: 10 }),
      discoveryService.getGenres(),
    ])
      .then(([r, g]) => {
        if (cancelled) return
        setRecipes(r)
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
  const picks = recipes.slice(1, 10)

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

      {/* ── Featured Recipe ─────────────────────────────────────────────── */}
      <section className="home-page__section">
        <span className="home-page__featured-label">{t('home.featured')}</span>
        <h2 className="home-page__section-title">{t('home.featured')}</h2>
        {featured ? (
          <RecipeCard
            recipe={featured}
            variant="hero"
            onClick={() => navigate(`/recipes/${featured.id}`)}
          />
        ) : (
          <p className="home-page__empty">{t('home.noRecipes')}</p>
        )}
      </section>

      {/* ── Community Picks ─────────────────────────────────────────────── */}
      {picks.length > 0 && (
        <section className="home-page__section">
          <div className="home-page__section-header">
            <h2 className="home-page__section-title">{t('home.communityPicks')}</h2>
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
          <h2 className="home-page__section-title">{t('home.browseByGenre')}</h2>
          <div className="home-page__genre-scroll">
            {genres.map((g) => (
              <GenreCard
                key={g.id}
                genre={g}
                onClick={() => navigate(`/search?genreId=${g.id}&genre=${encodeURIComponent(g.name)}`)}
              />
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
