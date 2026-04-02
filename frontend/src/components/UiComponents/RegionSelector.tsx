import { useTranslation } from 'react-i18next'

export interface RegionSelectorProps {
  regions: string[]
  selectedRegion: string | null
  onChange: (region: string | null) => void
}

export function RegionSelector({ regions, selectedRegion, onChange }: RegionSelectorProps) {
  const { t } = useTranslation('common')

  return (
    <fieldset className="filter-control">
      <legend className="filter-control__label">{t('discovery.region')}</legend>
      <div className="filter-control__options">
        <label className="filter-option">
          <input
            type="radio"
            name="region"
            value=""
            checked={selectedRegion === null}
            onChange={() => onChange(null)}
          />
          <span className="filter-option__text">{t('discovery.noRegionSelected')}</span>
        </label>
        {regions.map((region) => (
          <label key={region} className="filter-option">
            <input
              type="radio"
              name="region"
              value={region}
              checked={selectedRegion === region}
              onChange={() => onChange(region)}
            />
            <span className="filter-option__text">{region}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
