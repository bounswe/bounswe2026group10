import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ingredientService, type IngredientOption } from '@/services/ingredient-service'
import './IngredientPicker.css'

const SEARCH_DEBOUNCE_MS = 280
const MIN_SEARCH_LEN = 1

export interface IngredientPickerProps {
  ingredientId: number | null
  name: string
  onChange: (ingredientId: number | null, name: string) => void
  /** Called on every keystroke so the parent can validate “typed but not selected from API”. */
  onSearchInputChange?: (text: string) => void
  disabled?: boolean
}

export function IngredientPicker({ ingredientId, name, onChange, onSearchInputChange, disabled }: IngredientPickerProps) {
  const { t } = useTranslation('common')
  const baseId = useId()
  const listId = `${baseId}-list`
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [inputValue, setInputValue] = useState(() => (ingredientId !== null ? name : ''))
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<IngredientOption[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInputValue(ingredientId !== null ? name : '')
  }, [ingredientId, name])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < MIN_SEARCH_LEN) {
      setOptions([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const rows = await ingredientService.search(trimmed)
      setOptions(rows)
    } catch {
      setOptions([])
      setError(t('create.ingredients.searchError'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const onInputChange = (value: string) => {
    onSearchInputChange?.(value)
    setInputValue(value)
    if (ingredientId !== null) {
      onChange(null, '')
    }
    if (!value.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      setOptions([])
      setOpen(false)
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      void runSearch(value)
    }, SEARCH_DEBOUNCE_MS)
    setOpen(true)
  }

  const pick = (opt: IngredientOption) => {
    onSearchInputChange?.('')
    onChange(opt.id, opt.name)
    setInputValue(opt.name)
    setOpen(false)
    setOptions([])
  }

  const onFocus = () => {
    setOpen(true)
    if (inputValue.trim().length >= MIN_SEARCH_LEN) void runSearch(inputValue)
  }

  return (
    <div ref={containerRef} className="cr-ingredient-picker">
      <input
        type="text"
        className="cr-input cr-input--flex"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        value={inputValue}
        placeholder={t('create.ingredients.searchPlaceholder')}
        onChange={(e) => onInputChange(e.target.value)}
        onFocus={onFocus}
      />
      {error && <p className="cr-ingredient-picker__error">{error}</p>}
      {open && (loading || options.length > 0 || (!loading && inputValue.trim().length >= MIN_SEARCH_LEN)) && (
        <ul id={listId} className="cr-ingredient-picker__list" role="listbox">
          {loading && (
            <li className="cr-ingredient-picker__hint">{t('create.ingredients.searchLoading')}</li>
          )}
          {!loading &&
            options.map((opt) => (
              <li key={opt.id} role="option">
                <button
                  type="button"
                  className="cr-ingredient-picker__option"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(opt)}
                >
                  {opt.name}
                </button>
              </li>
            ))}
          {!loading && options.length === 0 && inputValue.trim().length >= MIN_SEARCH_LEN && (
            <li className="cr-ingredient-picker__hint">{t('create.ingredients.searchEmpty')}</li>
          )}
        </ul>
      )}
      {ingredientId !== null && (
        <span className="cr-ingredient-picker__badge" title={t('create.ingredients.selectedFromCatalog')}>
          ✓
        </span>
      )}
    </div>
  )
}
