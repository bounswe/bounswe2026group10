import { useTranslation } from 'react-i18next'

export interface Allergen {
  id: string
  name: string
}

export interface AllergenFilterProps {
  allergens: Allergen[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function AllergenFilter({ allergens, selectedIds, onChange }: AllergenFilterProps) {
  const { t } = useTranslation('common')

  const toggleAllergen = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((aId) => aId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <fieldset className="filter-control">
      <legend className="filter-control__label">{t('discovery.allergens')}</legend>
      <p className="filter-control__hint">{t('discovery.selectAllergens')}</p>
      <div className="filter-control__checkboxes">
        {allergens.map((allergen) => (
          <label key={allergen.id} className="filter-checkbox">
            <input
              type="checkbox"
              checked={selectedIds.includes(allergen.id)}
              onChange={() => toggleAllergen(allergen.id)}
              aria-label={t('discovery.avoidAllergen', { name: allergen.name })}
            />
            <span className="filter-checkbox__text">{allergen.name}</span>
          </label>
        ))}
      </div>
      {selectedIds.length > 0 && (
        <button
          type="button"
          className="filter-control__clear"
          onClick={() => onChange([])}
          aria-label={t('discovery.clearFilters')}
        >
          {t('discovery.clearFilters')}
        </button>
      )}
    </fieldset>
  )
}
