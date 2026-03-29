import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { discoveryService, type DishVariety, type Genre } from '@/services/discovery-service'
import { GenreCard } from '@/components/UiComponents/GenreCard'
import './SearchPage.css'

type SortOption = 'rating' | 'recent' | 'region'

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

export function SearchPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialQuery = searchParams.get('genre') ?? ''
  const initialGenreId = searchParams.get('genreId') ?? ''

  const [query, setQuery] = useState(initialQuery)
  const [sort, setSort] = useState<SortOption>('rating')
  const [genres, setGenres] = useState<Genre[]>([])
  // All varieties loaded once; filtered client-side
  const [allVarieties, setAllVarieties] = useState<DishVariety[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const isSearchActive = query.trim().length > 0

  // Load genres + all varieties once on mount
  useEffect(() => {
    setLoading(true)
    Promise.all([
      discoveryService.getGenres(),
      discoveryService.getVarieties(),
    ])
      .then(([g, v]) => {
        setGenres(g)
        setAllVarieties(v)
        // If arriving with a pre-selected genre, focus the input
        if (initialQuery) inputRef.current?.focus()
      })
      .catch(() => setError(t('common.errorRetry')))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filter varieties client-side based on query and/or genreId
  const filteredVarieties = useMemo(() => {
    let result = allVarieties

    // Pre-filter by genreId if arriving from Home genre card
    if (initialGenreId && !query) {
      result = result.filter((v) => v.genreId === initialGenreId)
    }

    const q = query.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (v) =>
          v.name.toLowerCase().includes(q) ||
          v.genre?.name.toLowerCase().includes(q) ||
          v.region?.toLowerCase().includes(q)
      )
    }

    return result
  }, [allVarieties, query, initialGenreId])

  const sortedVarieties = useMemo(() => {
    return [...filteredVarieties].sort((a, b) => {
      if (sort === 'region') return (a.region ?? '').localeCompare(b.region ?? '')
      if (sort === 'rating') return (b.recipeCount ?? 0) - (a.recipeCount ?? 0)
      return 0
    })
  }, [filteredVarieties, sort])

  const sortLabels: Record<SortOption, string> = {
    rating: t('search.sortBestRating'),
    recent: t('search.sortRecent'),
    region: t('search.sortByRegion'),
  }

  const handleGenreClick = (g: Genre) => {
    setQuery(g.name)
    inputRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="search-page">
        <div className="search-page__bar-wrap">
          <div className="search-page__bar">
            <span className="search-page__bar-icon"><SearchIcon /></span>
            <div style={{ flex: 1, height: '1rem', background: 'var(--color-neutral-dark)', borderRadius: 4 }} />
          </div>
        </div>
        <div className="search-page__genre-grid">
          {[1,2,3,4,5,6].map((i) => <div key={i} className="search-page__skeleton skeleton-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="search-page">

      {/* ── Search bar ──────────────────────────────────────────────────── */}
      <div className="search-page__bar-wrap">
        <label className="search-page__bar" htmlFor="search-input">
          <span className="search-page__bar-icon"><SearchIcon /></span>
          <input
            id="search-input"
            ref={inputRef}
            type="search"
            className="search-page__input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="search-page__clear"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              ×
            </button>
          )}
        </label>
      </div>

      {error && <p className="search-page__error">{error}</p>}

      {/* ── Default: Browse by Genre ──────────────────────────────────── */}
      {!isSearchActive && (
        <section className="search-page__section">
          <h2 className="search-page__section-title">{t('search.browseByGenre')}</h2>
          <div className="search-page__genre-grid">
            {genres.map((g) => (
              <GenreCard key={g.id} genre={g} onClick={() => handleGenreClick(g)} />
            ))}
          </div>
        </section>
      )}

      {/* ── Active search: Sort + Results ────────────────────────────── */}
      {isSearchActive && (
        <section className="search-page__section">
          <div className="search-page__sort-row" role="group" aria-label={t('search.sortLabel')}>
            {(Object.keys(sortLabels) as SortOption[]).map((opt) => (
              <button
                key={opt}
                type="button"
                className={`search-page__sort-btn${sort === opt ? ' search-page__sort-btn--active' : ''}`}
                onClick={() => setSort(opt)}
                aria-pressed={sort === opt}
              >
                {sortLabels[opt]}
              </button>
            ))}
          </div>

          {sortedVarieties.length === 0 ? (
            <p className="search-page__empty">{t('search.noResults')}</p>
          ) : (
            <>
              <p className="search-page__count">
                {t('search.resultsCount', { count: sortedVarieties.length })}
              </p>
              <div className="search-page__results">
                {sortedVarieties.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className="variety-card"
                    onClick={() => navigate(`/dish-variety/${v.id}`)}
                  >
                    <div className="variety-card__thumb">
                      {v.imageUrl ? (
                        <img src={v.imageUrl} alt={v.name} loading="lazy" />
                      ) : (
                        <div className="variety-card__thumb-placeholder" />
                      )}
                    </div>
                    <div className="variety-card__body">
                      <h3 className="variety-card__name">{v.name}</h3>
                      {v.genre && <p className="variety-card__region">{v.genre.name}</p>}
                      {v.region && <p className="variety-card__region">{v.region}</p>}
                      {v.recipeCount !== undefined && (
                        <p className="variety-card__count">
                          {v.recipeCount} {t('search.recipes')}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

    </div>
  )
}
