import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  discoveryService,
  type Genre,
  type RecipeSummary,
  type DiscoveryPagination,
} from '@/services/discovery-service'
import { RecipeCard } from '@/components/UiComponents/RecipeCard'
import { GenreCard } from '@/components/UiComponents/GenreCard'
import { DiscoveryFilters } from '@/components/Discovery/DiscoveryFilters'
import type { Allergen } from '@/components/UiComponents/AllergenFilter'
import type { DietaryTag } from '@/components/UiComponents/DietaryTagsFilter'
import './DiscoveryPage.css'

const PAGE_LIMIT = 8

export function DiscoveryPage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const initialGenreId = searchParams.get('genreId') ?? null

  const [genres, setGenres] = useState<Genre[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [allergens, setAllergens] = useState<Allergen[]>([])
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([])
  const [selectedGenreId, setSelectedGenreId] = useState<string | null>(initialGenreId)

  const [draftRegion, setDraftRegion] = useState<string | null>(null)
  const [draftAllergenIds, setDraftAllergenIds] = useState<string[]>([])
  const [draftDietaryTagIds, setDraftDietaryTagIds] = useState<string[]>([])

  const [appliedRegion, setAppliedRegion] = useState<string | null>(null)
  const [appliedAllergenIds, setAppliedAllergenIds] = useState<string[]>([])
  const [appliedDietaryTagIds, setAppliedDietaryTagIds] = useState<string[]>([])

  const [recipes, setRecipes] = useState<RecipeSummary[]>([])
  const [pagination, setPagination] = useState<DiscoveryPagination>({ page: 1, limit: PAGE_LIMIT, total: 0 })
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingMetadata, setLoadingMetadata] = useState(true)
  const [loadingResults, setLoadingResults] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingMetadata(true)

    Promise.all([
      discoveryService.getGenres().catch(() => []),
      discoveryService.getRegions().catch(() => []),
      discoveryService.getDietaryTags().catch(() => []),
    ]).then(([genreData, regionData, tagData]) => {
      if (cancelled) return

      setGenres(genreData)
      setRegions(regionData)
      setAllergens(tagData.filter((tag) => tag.category === 'allergen'))
      setDietaryTags(tagData.filter((tag) => tag.category === 'dietary'))
    }).finally(() => {
      if (!cancelled) setLoadingMetadata(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoadingResults(true)
    setError(null)

    discoveryService.getRecipeResults({
      region: appliedRegion ?? undefined,
      excludeAllergens: appliedAllergenIds.length > 0 ? appliedAllergenIds.join(',') : undefined,
      tagIds: appliedDietaryTagIds.length > 0 ? appliedDietaryTagIds.join(',') : undefined,
      genreId: selectedGenreId ? Number(selectedGenreId) : undefined,
      page,
      limit: PAGE_LIMIT,
    }).then((result) => {
      if (cancelled) return

      setRecipes(result.recipes)
      setPagination(result.pagination)
    }).catch(() => {
      if (!cancelled) setError(t('common.errorRetry'))
    }).finally(() => {
      if (!cancelled) setLoadingResults(false)
    })

    return () => {
      cancelled = true
    }
  }, [appliedAllergenIds, appliedDietaryTagIds, appliedRegion, page, selectedGenreId, t])

  const visibleRecipes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return recipes

    return recipes.filter((recipe) => {
      const searchable = [
        recipe.title,
        recipe.region ?? '',
        recipe.author.username,
        recipe.variety?.name ?? '',
        recipe.genre?.name ?? '',
      ].join(' ').toLowerCase()

      return searchable.includes(query)
    })
  }, [recipes, searchQuery])

  const totalPages = Math.max(1, Math.ceil(pagination.total / PAGE_LIMIT))
  const selectedGenre = selectedGenreId ? genres.find((genre) => genre.id === selectedGenreId) ?? null : null

  const handleApplyFilters = () => {
    setAppliedRegion(draftRegion)
    setAppliedAllergenIds(draftAllergenIds)
    setAppliedDietaryTagIds(draftDietaryTagIds)
    setPage(1)
  }

  const resetAll = () => {
    setDraftRegion(null)
    setDraftAllergenIds([])
    setDraftDietaryTagIds([])
    setAppliedRegion(null)
    setAppliedAllergenIds([])
    setAppliedDietaryTagIds([])
    setSelectedGenreId(null)
    setSearchQuery('')
    setPage(1)
  }

  return (
    <div className="discovery-page">
      <section className="discovery-page__hero">
        <p className="discovery-page__eyebrow">{t('nav.discovery')}</p>
        <h1 className="discovery-page__title">{t('discovery.title')}</h1>
        <p className="discovery-page__subtitle">{t('discovery.subtitle')}</p>
      </section>

      <section className="discovery-page__section">
        <div className="discovery-page__section-header">
          <div>
            <h2 className="discovery-page__section-title">{t('home.browseByGenre')}</h2>
            <p className="discovery-page__section-copy">
              {selectedGenre ? selectedGenre.name : t('discovery.noRegionSelected')}
            </p>
          </div>
          <button type="button" className="discovery-page__clear-genre" onClick={resetAll}>
            {t('discovery.clearFilters')}
          </button>
        </div>

        <div className="discovery-page__genre-grid">
          {genres.map((genre) => (
            <GenreCard
              key={genre.id}
              genre={genre}
              isActive={selectedGenreId === genre.id}
              onClick={() => {
                setSelectedGenreId((current) => (current === genre.id ? null : genre.id))
                setPage(1)
              }}
            />
          ))}
        </div>
      </section>

      <div className="discovery-page__layout">
        <DiscoveryFilters
          regions={regions}
          allergens={allergens}
          dietaryTags={dietaryTags}
          selectedRegion={draftRegion}
          selectedAllergens={draftAllergenIds}
          selectedDietaryTags={draftDietaryTagIds}
          onRegionChange={setDraftRegion}
          onAllergensChange={setDraftAllergenIds}
          onDietaryTagsChange={setDraftDietaryTagIds}
          onApplyFilters={handleApplyFilters}
          isLoading={loadingMetadata}
        />

        <section className="discovery-page__results">
          <label className="discovery-page__searchbar" htmlFor="discovery-search">
            <span className="discovery-page__searchbar-label">{t('search.placeholder')}</span>
            <input
              id="discovery-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('search.placeholder')}
            />
          </label>

          {error && <p className="discovery-page__error">{error}</p>}

          <div className="discovery-page__results-meta">
            <p className="discovery-page__results-count">
              {t('discovery.resultsCount', { count: visibleRecipes.length })}
            </p>
          </div>

          {loadingResults && recipes.length === 0 ? (
            <div className="discovery-page__skeleton-grid">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="discovery-page__skeleton-card skeleton-pulse" />
              ))}
            </div>
          ) : visibleRecipes.length === 0 ? (
            <div className="discovery-page__empty">
              <p>{t('discovery.noResults')}</p>
              <button type="button" className="discovery-page__retry" onClick={resetAll}>
                {t('common.retry')}
              </button>
            </div>
          ) : (
            <div className="discovery-page__results-grid">
              {visibleRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  variant="horizontal"
                  onClick={() => navigate(`/recipes/${recipe.id}`)}
                />
              ))}
            </div>
          )}

          <div className="discovery-page__pagination" role="navigation" aria-label={t('discovery.paginationLabel')}>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1 || loadingResults}
            >
              {t('discovery.previousPage')}
            </button>
            <span>{t('discovery.pagination', { page, total: totalPages })}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages || loadingResults}
            >
              {t('discovery.nextPage')}
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}