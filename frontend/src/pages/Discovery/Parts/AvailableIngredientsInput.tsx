import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ingredientService, type IngredientOption } from '@/services/ingredient-service'

const SEARCH_DEBOUNCE_MS = 250
const MIN_SEARCH_LEN = 1

export interface AvailableIngredientsInputProps {
  selected: IngredientOption[]
  onChange: (next: IngredientOption[]) => void
}

/**
 * Compact multi-select autocomplete for the Discovery filter panel.
 *
 * Powers the "available ingredients" filter (`GET /discovery/recipes/by-ingredients`):
 * picks ingredients from `/ingredients?search=`, renders them as removable chips.
 */
export function AvailableIngredientsInput({ selected, onChange }: AvailableIngredientsInputProps) {
  const { t } = useTranslation('common')
  const baseId = useId()
  const listId = `${baseId}-list`
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<IngredientOption[]>([])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = query.trim()
    if (trimmed.length < MIN_SEARCH_LEN) {
      setOptions([])
      return
    }
    debounceRef.current = setTimeout(() => {
      setLoading(true)
      ingredientService
        .search(trimmed)
        .then((results) => {
          const selectedIds = new Set(selected.map((s) => s.id))
          setOptions(results.filter((r) => !selectedIds.has(r.id)))
        })
        .catch(() => setOptions([]))
        .finally(() => setLoading(false))
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, selected])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(option: IngredientOption) {
    onChange([...selected, option])
    setQuery('')
    setOptions([])
  }

  function handleRemove(id: number) {
    onChange(selected.filter((s) => s.id !== id))
  }

  return (
    <div
      ref={containerRef}
      className="discovery-page__ing-input"
      data-testid="available-ingredients-input"
    >
      {selected.length > 0 && (
        <div className="discovery-page__ing-chips">
          {selected.map((ing) => (
            <span key={ing.id} className="discovery-page__ing-chip">
              {ing.name}
              <button
                type="button"
                className="discovery-page__ing-chip-remove"
                aria-label={t('discovery.availableIngredients.remove', { name: ing.name })}
                onClick={() => handleRemove(ing.id)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="discovery-page__ing-search">
        <input
          type="text"
          className="discovery-page__ing-search-input"
          value={query}
          placeholder={t('discovery.availableIngredients.placeholder')}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          aria-controls={listId}
          aria-expanded={open && options.length > 0}
        />
        {open && (loading || options.length > 0) && (
          <ul id={listId} className="discovery-page__ing-options" role="listbox">
            {loading && (
              <li className="discovery-page__ing-option discovery-page__ing-option--muted">
                {t('common.loading')}
              </li>
            )}
            {!loading &&
              options.map((option) => (
                <li
                  key={option.id}
                  className="discovery-page__ing-option"
                  role="option"
                  aria-selected="false"
                >
                  <button
                    type="button"
                    className="discovery-page__ing-option-btn"
                    onClick={() => handleSelect(option)}
                  >
                    {option.name}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  )
}
