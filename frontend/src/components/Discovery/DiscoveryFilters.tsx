import { useTranslation } from 'react-i18next'
import { RegionSelector } from '@/components/UiComponents/RegionSelector'
import { AllergenFilter, type Allergen } from '@/components/UiComponents/AllergenFilter'
import { DietaryTagsFilter, type DietaryTag } from '@/components/UiComponents/DietaryTagsFilter'
import './DiscoveryFilters.css'

export interface DiscoveryFiltersProps {
  regions: string[]
  allergens: Allergen[]
  dietaryTags: DietaryTag[]
  selectedRegion: string | null
  selectedAllergens: string[]
  selectedDietaryTags: string[]
  onRegionChange: (region: string | null) => void
  onAllergensChange: (ids: string[]) => void
  onDietaryTagsChange: (ids: string[]) => void
  onApplyFilters: () => void
  isLoading?: boolean
}

export function DiscoveryFilters({
  regions,
  allergens,
  dietaryTags,
  selectedRegion,
  selectedAllergens,
  selectedDietaryTags,
  onRegionChange,
  onAllergensChange,
  onDietaryTagsChange,
  onApplyFilters,
  isLoading = false,
}: DiscoveryFiltersProps) {
  const { t } = useTranslation('common')

  const hasActiveFilters =
    selectedRegion !== null || selectedAllergens.length > 0 || selectedDietaryTags.length > 0

  const handleClearAll = () => {
    onRegionChange(null)
    onAllergensChange([])
    onDietaryTagsChange([])
  }

  return (
    <aside className="discovery-filters">
      <div className="discovery-filters__header">
        <h2 className="discovery-filters__title">{t('discovery.filters')}</h2>
        {hasActiveFilters && (
          <button
            type="button"
            className="discovery-filters__reset"
            onClick={handleClearAll}
            disabled={isLoading}
          >
            {t('discovery.clearFilters')}
          </button>
        )}
      </div>

      <form className="discovery-filters__form" onSubmit={(e) => { e.preventDefault(); onApplyFilters() }}>
        <RegionSelector regions={regions} selectedRegion={selectedRegion} onChange={onRegionChange} />

        <AllergenFilter allergens={allergens} selectedIds={selectedAllergens} onChange={onAllergensChange} />

        <DietaryTagsFilter tags={dietaryTags} selectedIds={selectedDietaryTags} onChange={onDietaryTagsChange} />

        <button
          type="submit"
          className="discovery-filters__apply"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? t('discovery.loading') : t('discovery.applyFilters')}
        </button>
      </form>
    </aside>
  )
}
