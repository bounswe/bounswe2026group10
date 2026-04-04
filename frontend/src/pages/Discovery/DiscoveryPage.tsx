import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GenreCard } from '@/components/UiComponents/GenreCard'
import { RecipeCard } from '@/components/UiComponents/RecipeCard'
import { PaginationControl } from '@/components/UiComponents/PaginationControl'
import {
  discoveryService,
  type DishVariety,
  type Genre,
  type RecipeSummary,
} from '@/services/discovery-service'
import './DiscoveryPage.css'

const SEARCH_DEBOUNCE_MS = 300
const RECIPES_PER_PAGE = 12

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

  const [loadingGenres, setLoadingGenres] = useState(true)
  const [loadingVarieties, setLoadingVarieties] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [recipeLoading, setRecipeLoading] = useState(true)
  const [recipePage, setRecipePage] = useState(1)
  const [recipeTotal, setRecipeTotal] = useState(0)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timeout)
  }, [searchInput])

  useEffect(() => {
    let cancelled = false
    setError(null)

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

  useEffect(() => {
    let cancelled = false
    setRecipeLoading(true)

    discoveryService
      .getRecipeResults({
        genreId: selectedGenreId ?? undefined,
        page: recipePage,
        limit: RECIPES_PER_PAGE,
      })
      .then(({ recipes: recipeData, pagination }) => {
        if (!cancelled) {
          setRecipes(recipeData)
          setRecipeTotal(pagination.total)
        }
      })
      .catch(() => {
        if (!cancelled) setRecipes([])
      })
      .finally(() => {
        if (!cancelled) setRecipeLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedGenreId, recipePage])

  const normalizedSearch = debouncedSearch.trim().toLowerCase()

  const filteredGenres = useMemo(() => {
    if (!normalizedSearch) return genres
    return genres.filter((genre) => genre.name.toLowerCase().includes(normalizedSearch))
  }, [genres, normalizedSearch])

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

  const totalRecipePages = Math.max(1, Math.ceil(recipeTotal / RECIPES_PER_PAGE))

  const selectedGenre = useMemo(
    () => (selectedGenreId ? genres.find((genre) => genre.id === selectedGenreId) ?? null : null),
    [genres, selectedGenreId],
  )

  function handleGenreClick(genreId: string) {
    setSelectedGenreId((prev) => (prev === genreId ? null : genreId))
    setRecipePage(1)
  }

  function handleClearFilters() {
    setSelectedGenreId(null)
    setSearchInput('')
    setDebouncedSearch('')
    setRecipePage(1)
  }

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
                <path
                  d="M20 20L16.65 16.65"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </span>
        </label>
      </section>

      {/* Genres — horizontal scroll */}
      <section className="discovery-page__section">
        <div className="discovery-page__section-header">
          <div>
            <h2 className="discovery-page__section-title">
              {normalizedSearch ? t('discovery.searchGenresTitle') : t('discovery.genresTitle')}
            </h2>
            {selectedGenre && !normalizedSearch && (
              <p className="discovery-page__section-copy">{selectedGenre.name}</p>
            )}
          </div>
          {selectedGenreId && (
            <button
              type="button"
              className="discovery-page__clear-genre"
              onClick={handleClearFilters}
            >
              {t('discovery.clearFilters')}
            </button>
          )}
        </div>

        {loadingGenres ? (
          <div className="discovery-page__genre-scroll">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="discovery-page__skeleton-genre skeleton-pulse" />
            ))}
          </div>
        ) : filteredGenres.length === 0 ? (
          <div className="discovery-page__empty">
            <p>{t('discovery.noSearchMatches')}</p>
          </div>
        ) : (
          <div className="discovery-page__genre-scroll">
            {filteredGenres.map((genre) => (
              <GenreCard
                key={genre.id}
                genre={genre}
                isActive={selectedGenreId === genre.id}
                onClick={() => handleGenreClick(genre.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Varieties — horizontal scroll */}
      <section className="discovery-page__section discovery-page__varieties">
        <div className="discovery-page__section-header">
          <div>
            <h2 className="discovery-page__section-title">
              {normalizedSearch ? t('discovery.searchVarietiesTitle') : t('discovery.varietiesTitle')}
            </h2>
            {selectedGenre && !normalizedSearch && (
              <p className="discovery-page__section-copy">
                {t('discovery.varietiesHint', { genre: selectedGenre.name })}
              </p>
            )}
          </div>
        </div>

        {error && <p className="discovery-page__error">{error}</p>}

        {loadingVarieties ? (
          <div className="discovery-page__variety-scroll">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="discovery-page__skeleton-chip skeleton-pulse" />
            ))}
          </div>
        ) : filteredVarieties.length === 0 ? (
          <div className="discovery-page__empty">
            <p>{t('discovery.noSearchMatches')}</p>
          </div>
        ) : (
          <div className="discovery-page__variety-scroll">
            {filteredVarieties.map((variety) => (
              <button
                key={variety.id}
                type="button"
                className="discovery-page__variety-chip"
                onClick={() => navigate(`/dish-variety/${variety.id}`)}
              >
                <span className="discovery-page__variety-chip-name">{variety.name}</span>
                {variety.genre && (
                  <span className="discovery-page__variety-chip-genre">{variety.genre.name}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Recipes — grid */}
      <section className="discovery-page__section">
        <div className="discovery-page__section-header">
          <div>
            <h2 className="discovery-page__section-title">{t('discovery.recipesTitle')}</h2>
            {selectedGenre && (
              <p className="discovery-page__section-copy">{selectedGenre.name}</p>
            )}
          </div>
        </div>

        {recipeLoading ? (
          <div className="discovery-page__recipe-grid">
            {Array.from({ length: RECIPES_PER_PAGE }).map((_, i) => (
              <div key={i} className="discovery-page__skeleton-recipe skeleton-pulse" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="discovery-page__empty">
            <p>{t('discovery.noResults')}</p>
          </div>
        ) : (
          <div className="discovery-page__recipe-grid">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                variant="hero"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              />
            ))}
          </div>
        )}

        {!recipeLoading && recipeTotal > RECIPES_PER_PAGE && (
          <div className="discovery-page__recipe-pagination">
            <PaginationControl
              currentPage={recipePage}
              totalPages={totalRecipePages}
              onPreviousClick={() => setRecipePage((prev) => Math.max(1, prev - 1))}
              onNextClick={() => setRecipePage((prev) => Math.min(totalRecipePages, prev + 1))}
              isLoading={recipeLoading}
            />
          </div>
        )}
      </section>
    </div>
  )
}
