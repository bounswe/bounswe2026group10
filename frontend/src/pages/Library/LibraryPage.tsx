import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { recipeService, type MyRecipeSummary } from '@/services/recipe-service'
import './LibraryPage.css'

type StatusFilter = 'all' | 'published' | 'draft'
type SortKey = 'date_desc' | 'date_asc' | 'rating_desc' | 'rating_asc'

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

function sortRecipes(recipes: MyRecipeSummary[], sort: SortKey): MyRecipeSummary[] {
  const sorted = [...recipes]
  switch (sort) {
    case 'date_desc':
      return sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    case 'date_asc':
      return sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    case 'rating_desc':
      return sorted.sort((a, b) => (b.averageRating ?? -1) - (a.averageRating ?? -1))
    case 'rating_asc':
      return sorted.sort((a, b) => (a.averageRating ?? Infinity) - (b.averageRating ?? Infinity))
  }
}

export function LibraryPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()

  const [filter, setFilter] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortKey>('date_desc')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [recipes, setRecipes] = useState<MyRecipeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const statusParam = filter === 'all' ? undefined : filter

    recipeService
      .getMyRecipes(statusParam)
      .then((data) => {
        if (!cancelled) {
          setRecipes(data)
          setSelectedCountry('')
          setSelectedCity('')
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('common.errorRetry'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filter, t])

  const countries = useMemo(
    () => [...new Set(recipes.map((r) => r.country).filter(Boolean) as string[])].sort(),
    [recipes],
  )

  const cities = useMemo(() => {
    const source = selectedCountry
      ? recipes.filter((r) => r.country === selectedCountry)
      : recipes
    return [...new Set(source.map((r) => r.city).filter(Boolean) as string[])].sort()
  }, [recipes, selectedCountry])

  const displayedRecipes = useMemo(() => {
    let result = recipes
    if (selectedCountry) result = result.filter((r) => r.country === selectedCountry)
    if (selectedCity) result = result.filter((r) => r.city === selectedCity)
    return sortRecipes(result, sort)
  }, [recipes, selectedCountry, selectedCity, sort])

  const hasLocationData = countries.length > 0

  return (
    <div className="library-page">
      <h1 className="library-page__title">{t('library.title')}</h1>

      <div className="library-page__tabs" role="tablist">
        {(['all', 'published', 'draft'] as StatusFilter[]).map((tab) => (
          <button
            key={tab}
            role="tab"
            type="button"
            className={`library-page__tab${filter === tab ? ' library-page__tab--active' : ''}`}
            aria-selected={filter === tab}
            onClick={() => setFilter(tab)}
          >
            {t(`library.tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)}
          </button>
        ))}
      </div>

      {!loading && recipes.length > 0 && (
        <div className="library-page__toolbar">
          <label className="library-page__sort-label" htmlFor="library-sort">
            {t('library.sortLabel')}
          </label>
          <select
            id="library-sort"
            className="library-page__sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="date_desc">{t('library.sortDateDesc')}</option>
            <option value="date_asc">{t('library.sortDateAsc')}</option>
            <option value="rating_desc">{t('library.sortRatingDesc')}</option>
            <option value="rating_asc">{t('library.sortRatingAsc')}</option>
          </select>

          {hasLocationData && (
            <>
              <select
                className="library-page__sort-select"
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value)
                  setSelectedCity('')
                }}
                aria-label={t('library.filterCountry')}
              >
                <option value="">{t('library.filterCountryAll')}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {cities.length > 0 && (
                <select
                  className="library-page__sort-select"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  aria-label={t('library.filterCity')}
                >
                  <option value="">{t('library.filterCityAll')}</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              )}
            </>
          )}
        </div>
      )}

      {error && <p className="library-page__error">{error}</p>}

      {loading ? (
        <div className="library-page__loading">
          <span className="library-page__spinner" aria-hidden />
          <p>{t('library.loading')}</p>
        </div>
      ) :displayedRecipes.length === 0 ? (
        <div className="library-page__empty">
          <p>{t('library.empty')}</p>
          {(filter !== 'all' || selectedCountry || selectedCity) && (
            <button
              type="button"
              className="library-page__empty-action"
              onClick={() => { setFilter('all'); setSelectedCountry(''); setSelectedCity('') }}
            >
              {t('library.showAll')}
            </button>
          )}
        </div>
      ) : (
        <div className="library-page__list">
          {displayedRecipes.map((recipe) => {
            const location = [recipe.city, recipe.country].filter(Boolean).join(', ')
            return (
              <button
                key={recipe.id}
                type="button"
                className="library-page__card"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <div className="library-page__card-thumb">
                  {recipe.coverImageUrl ? (
                    <img src={recipe.coverImageUrl} alt={recipe.title} loading="lazy" />
                  ) : (
                    <div className="library-page__card-placeholder" />
                  )}
                </div>
                <div className="library-page__card-body">
                  <div className="library-page__card-header">
                    <h3 className="library-page__card-title">{recipe.title}</h3>
                    <div className="library-page__card-actions">
                      <span
                        className={`library-page__status library-page__status--${recipe.isPublished ? 'published' : 'draft'}`}
                      >
                        {t(recipe.isPublished ? 'library.statusPublished' : 'library.statusDraft')}
                      </span>
                      <button
                        type="button"
                        className="library-page__edit-btn"
                        onClick={(e) => { e.stopPropagation(); navigate(`/recipes/${recipe.id}/edit`) }}
                      >
                        {t('library.edit')}
                      </button>
                    </div>
                  </div>
                  <div className="library-page__card-meta">
                    <span className={`library-page__type library-page__type--${recipe.type}`}>
                      {t(recipe.type === 'cultural' ? 'library.typeCultural' : 'library.typeCommunity')}
                    </span>
                    {recipe.averageRating !== null && (
                      <span className="library-page__rating">
                        <StarIcon />
                        {recipe.averageRating.toFixed(1)}
                        <span className="library-page__rating-count">({recipe.ratingCount})</span>
                      </span>
                    )}
                    {location && (
                      <span className="library-page__location">{location}</span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
