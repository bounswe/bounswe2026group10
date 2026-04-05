import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { unitService } from '@/services/unit-service'
import './IngredientPicker.css'

const SEARCH_DEBOUNCE_MS = 280
const MIN_SEARCH_LEN = 1

export interface UnitPickerProps {
  value: string
  onChange: (unit: string) => void
  disabled?: boolean
}

/**
 * Autocomplete combobox backed by GET /units.
 * Allows free text — no strict catalog selection required.
 */
export function UnitPicker({ value, onChange, disabled }: UnitPickerProps) {
  const { t } = useTranslation('common')
  const baseId = useId()
  const listId = `${baseId}-list`
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const runSearch = useCallback(
    async (q: string) => {
      const trimmed = q.trim()
      if (trimmed.length < MIN_SEARCH_LEN) {
        setOptions([])
        setLoading(false)
        return
      }
      setLoading(true)
      setError(null)
      try {
        const rows = await unitService.search(trimmed)
        setOptions(rows)
      } catch {
        setOptions([])
        setError(t('create.ingredients.unitSearchError'))
      } finally {
        setLoading(false)
      }
    },
    [t],
  )

  const onInputChange = (newValue: string) => {
    onChange(newValue)
    if (!newValue.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setOptions([])
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void runSearch(newValue)
    }, SEARCH_DEBOUNCE_MS)
    setOpen(true)
  }

  const pick = (unit: string) => {
    onChange(unit)
    setOpen(false)
    setOptions([])
  }

  const onFocus = () => {
    setOpen(true)
    if (value.trim().length >= MIN_SEARCH_LEN) void runSearch(value)
  }

  return (
    <div ref={containerRef} className="cr-ingredient-picker cr-unit-picker">
      <input
        type="text"
        className="cr-input cr-input--unit"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        value={value}
        placeholder={t('create.ingredients.unitPlaceholder')}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={onFocus}
      />
      {error && <p className="cr-ingredient-picker__error">{error}</p>}
      {open &&
        (loading || options.length > 0 || (!loading && value.trim().length >= MIN_SEARCH_LEN)) && (
          <ul id={listId} className="cr-ingredient-picker__list" role="listbox">
            {loading && (
              <li className="cr-ingredient-picker__hint">{t('create.ingredients.searchLoading')}</li>
            )}
            {!loading &&
              options.map((unit) => (
                <li key={unit} role="option">
                  <button
                    type="button"
                    className="cr-ingredient-picker__option"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pick(unit)}
                  >
                    {unit}
                  </button>
                </li>
              ))}
            {!loading && options.length === 0 && value.trim().length >= MIN_SEARCH_LEN && (
              <li className="cr-ingredient-picker__hint">
                {t('create.ingredients.unitSearchEmpty')}
              </li>
            )}
          </ul>
        )}
    </div>
  )
}
