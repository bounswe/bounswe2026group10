import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GenreCard } from '@/components/UiComponents/GenreCard'
import { PaginationControl } from '@/components/UiComponents/PaginationControl'
import { discoveryService, type DishVariety, type Genre } from '@/services/discovery-service'
import './DiscoveryPage.css'

const SEARCH_DEBOUNCE_MS = 300
const GENRES_PER_PAGE = 8

export function DiscoveryPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialGenreId = searchParams.get('genreId') ?? null

  const [genres, setGenres] = useState<Genre[]>([])
  const [allVarieties, setAllVarieties] = useState<DishVariety[]>([])
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(initialGenreId)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [genrePage, setGenrePage] = useState(1)

  const [loadingGenres, setLoadingGenres] = useState(true)
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) setError(null)
    })

    Promise.all([discoveryService.getGenres(), discoveryService.getVarieties()])
      .then(([genreData, varietyData]) => {
        if (!cancelled) {
          setGenres(genreData)
          setAllVarieties(varietyData)
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('common.errorRetry'))
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingGenres(false)
          setLoadingVarieties(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [t])

  const selectedGenre = useMemo(
    () => (selectedGenreId ? genres.find((genre) => genre.id === selectedGenreId) ?? null : null),
    [genres, selectedGenreId],
  )

  const normalizedSearch = debouncedSearch.trim().toLowerCase()

  const filteredGenres = useMemo(() => {
    if (!normalizedSearch) return genres
    return genres.filter((genre) => genre.name.toLowerCase().includes(normalizedSearch))
  }, [genres, normalizedSearch])

  const totalGenrePages = Math.max(1, Math.ceil(filteredGenres.length / GENRES_PER_PAGE))
  const currentGenrePage = Math.min(genrePage, totalGenrePages)

  const paginatedGenres = useMemo(() => {
    const startIndex = (currentGenrePage - 1) * GENRES_PER_PAGE
    const endIndex = startIndex + GENRES_PER_PAGE
    return filteredGenres.slice(startIndex, endIndex)
  }, [currentGenrePage, filteredGenres])

  const filteredVarieties = useMemo(() => {
    let result = allVarieties

    if (selectedGenreId) {
      result = result.filter((variety) => variety.genreId === selectedGenreId)
    }

    if (normalizedSearch) {
      result = result.filter((variety) => {
        const varietyName = variety.name.toLowerCase()
        const genreName = variety.genre?.name.toLowerCase() ?? ''
        const regionName = variety.region?.toLowerCase() ?? ''

        return (
          varietyName.includes(normalizedSearch) ||
          genreName.includes(normalizedSearch) ||
          regionName.includes(normalizedSearch)
        )
      })
    }

    return result
  }, [allVarieties, normalizedSearch, selectedGenreId])

  const showSearchResults = normalizedSearch.length > 0
  const hasAnySearchMatches = filteredGenres.length > 0 || filteredVarieties.length > 0

  return (
    <div className="discovery-page">
      <section className="discovery-page__hero">
        <h1 className="discovery-page__title">{t('discovery.title')}</h1>
        <p className="discovery-page__subtitle">{t('discovery.subtitle')}</p>

        <label className="discovery-page__searchbar" htmlFor="discovery-search-input">
          <span className="discovery-page__searchbar-input-wrap">
            <input
              id="discovery-search-input"
              type="search"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value)
                setGenrePage(1)
              }}
              placeholder={t('discovery.searchPlaceholder')}
            />

            <button
              type="button"
              className="discovery-page__search-icon"
              aria-label={t('discovery.searchLabel')}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                <path d="M20 20L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        </label>
      </section>

      <section className="discovery-page__section">
        <div className="discovery-page__section-header">
          <div>
            <h2 className="discovery-page__section-title">
              {showSearchResults ? t('discovery.searchGenresTitle') : t('home.browseByGenre')}
            </h2>
            <p className="discovery-page__section-copy">
              {showSearchResults
                ? t('discovery.searchGenresHint', { query: searchInput.trim() })
                : selectedGenre
                  ? selectedGenre.name
                  : t('discovery.selectGenrePrompt')}
            </p>
          </div>
          {selectedGenreId && (
            <button
              type="button"
              className="discovery-page__clear-genre"
              onClick={() => {
                setSelectedGenreId(null)
                setSearchInput('')
                setDebouncedSearch('')
                setGenrePage(1)
              }}
            >
              {t('discovery.clearFilters')}
            </button>
          )}
        </div>

        {loadingGenres ? (
          <div className="discovery-page__genre-grid">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="discovery-page__skeleton-card skeleton-pulse" />
            ))}
          </div>
        ) : showSearchResults && filteredGenres.length === 0 ? (
          <div className="discovery-page__empty">
            <p>{t('discovery.noSearchMatches')}</p>
          </div>
        ) : (
          <div className="discovery-page__genre-grid">
            {paginatedGenres.map((genre) => (
              <GenreCard
                key={genre.id}
                genre={genre}
                isActive={selectedGenreId === genre.id}
                onClick={() => {
                  setSelectedGenreId(genre.id)
                }}
              />
            ))}
          </div>
        )}

        {!loadingGenres && filteredGenres.length > 0 && totalGenrePages > 1 && (
          <div className="discovery-page__genre-pagination">
            <PaginationControl
              currentPage={currentGenrePage}
              totalPages={totalGenrePages}
              onPreviousClick={() => setGenrePage((prev) => Math.max(1, prev - 1))}
              onNextClick={() => setGenrePage((prev) => Math.min(totalGenrePages, prev + 1))}
            />
          </div>
        )}
      </section>

      <section className="discovery-page__section discovery-page__varieties">
        <div className="discovery-page__section-header">
          <div>
            <h2 className="discovery-page__section-title">
              {showSearchResults ? t('discovery.searchVarietiesTitle') : t('discovery.varietiesTitle')}
            </h2>
            <p className="discovery-page__section-copy">
              {showSearchResults
                ? t('discovery.searchVarietiesHint', { query: searchInput.trim() })
                : selectedGenre
                  ? t('discovery.varietiesHint', { genre: selectedGenre.name })
                  : t('discovery.selectGenrePrompt')}
            </p>
          </div>
        </div>

        {error && <p className="discovery-page__error">{error}</p>}

        {showSearchResults ? (
          loadingVarieties ? (
            <div className="discovery-page__variety-list">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="discovery-page__variety-item skeleton-pulse" />
              ))}
            </div>
          ) : hasAnySearchMatches ? (
            <div className="discovery-page__variety-list">
              {filteredVarieties.map((variety) => (
                <button
                  key={variety.id}
                  type="button"
                  className="discovery-page__variety-item"
                  onClick={() => navigate(`/dish-variety/${variety.id}`)}
                >
                  <span className="discovery-page__variety-name">{variety.name}</span>
                  <span className="discovery-page__variety-count">
                    {variety.genre?.name ?? t('discovery.noGenreLabel')}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="discovery-page__empty">
              <p>{t('discovery.noSearchMatches')}</p>
            </div>
          )
        ) : !selectedGenreId ? (
          <div className="discovery-page__empty">
            <p>{t('discovery.selectGenrePrompt')}</p>
          </div>
        ) : loadingVarieties ? (
          <div className="discovery-page__variety-list">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="discovery-page__variety-item skeleton-pulse" />
            ))}
          </div>
        ) : filteredVarieties.length === 0 ? (
          <div className="discovery-page__empty">
            <p>{t('search.noResults')}</p>
          </div>
        ) : (
          <div className="discovery-page__variety-list">
            {filteredVarieties.map((variety) => (
              <button
                key={variety.id}
                type="button"
                className="discovery-page__variety-item"
                onClick={() => navigate(`/dish-variety/${variety.id}`)}
              >
                <span className="discovery-page__variety-name">{variety.name}</span>
                {typeof variety.recipeCount === 'number' && (
                  <span className="discovery-page__variety-count">
                    {t('dishVariety.recipes', { count: variety.recipeCount })}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
