import { useTranslation } from 'react-i18next'

export interface DietaryTag {
  id: string
  name: string
  category?: string
}

export interface DietaryTagsFilterProps {
  tags: DietaryTag[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function DietaryTagsFilter({ tags, selectedIds, onChange }: DietaryTagsFilterProps) {
  const { t } = useTranslation('common')

  const toggleTag = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((tId) => tId !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <fieldset className="filter-control">
      <legend className="filter-control__label">{t('discovery.dietaryTags')}</legend>
      <p className="filter-control__hint">{t('discovery.selectDietaryTags')}</p>
      <div className="filter-control__tags">
        {tags.map((tag) => (
          <label key={tag.id} className="filter-tag">
            <input
              type="checkbox"
              checked={selectedIds.includes(tag.id)}
              onChange={() => toggleTag(tag.id)}
              aria-label={tag.name}
            />
            <span className="filter-tag__text">{tag.name}</span>
          </label>
        ))}
      </div>
      {selectedIds.length > 0 && (
        <button
          type="button"
          className="filter-control__clear"
          onClick={() => onChange([])}
          aria-label="Clear dietary tag selection"
        >
          {t('discovery.clearFilters')}
        </button>
      )}
    </fieldset>
  )
}
