import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { discoveryService, type DishVariety, type Genre } from '@/services/discovery-service'
import { recipeService, type CreateRecipeIngredient, type RecipeDetail } from '@/services/recipe-service'
import { IngredientPicker } from '@/components/CreateRecipe/IngredientPicker'
import { ToolPicker } from '@/components/CreateRecipe/ToolPicker'
import { UnitPicker } from '@/components/CreateRecipe/UnitPicker'
import { useUserRole } from '@/hooks/useUserRole'
import './EditRecipePage.css'

interface IngredientRow {
  ingredientId: number | null
  name: string
  searchQuery: string
  quantity: string
  unit: string
}

interface StepItem { text: string }

function parseQty(v: string): number | null {
  const n = parseFloat(String(v).replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? n : null
}

function rowComplete(r: IngredientRow) {
  return r.ingredientId !== null && parseQty(r.quantity) !== null && r.unit.trim().length > 0
}

function rowInvalid(r: IngredientRow) {
  if (!r.ingredientId && !r.searchQuery.trim() && !r.quantity.trim() && !r.unit.trim()) return false
  if (r.ingredientId === null) return true
  return !rowComplete(r)
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="3,6 5,6 21,6" />
      <path d="M19,6l-1,14a2,2,0,0,1-2,2H8a2,2,0,0,1-2-2L5,6" />
      <path d="M10,11v6M14,11v6M9,6V4h6v2" />
    </svg>
  )
}

export function EditRecipePage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const role = useUserRole()

  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [story, setStory] = useState('')
  const [type, setType] = useState<'community' | 'cultural'>('community')
  const [genreId, setGenreId] = useState('')
  const [dishVarietyId, setDishVarietyId] = useState('')
  const [servingSize, setServingSize] = useState('')
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { ingredientId: null, name: '', searchQuery: '', quantity: '', unit: '' },
  ])
  const [steps, setSteps] = useState<StepItem[]>([{ text: '' }])
  const [tools, setTools] = useState<string[]>([''])

  // Dropdown data
  const [genres, setGenres] = useState<Genre[]>([])
  const [allVarieties, setAllVarieties] = useState<DishVariety[]>([])

  const canCreateCultural = role === 'expert'

  useEffect(() => {
    if (!id) return
    let cancelled = false

    Promise.all([
      recipeService.getById(id),
      discoveryService.getGenres(),
      discoveryService.getVarieties(),
    ])
      .then(([recipe, genreList, varietyList]: [RecipeDetail, Genre[], DishVariety[]]) => {
        if (cancelled) return
        setGenres(genreList)
        setAllVarieties(varietyList)

        // Pre-fill form
        setTitle(recipe.title)
        setStory(recipe.story ?? '')
        setType(recipe.type)
        setServingSize(recipe.servingSize ? String(recipe.servingSize) : '')
        setCountry(recipe.country ?? '')
        setCity(recipe.city ?? '')
        setDistrict(recipe.district ?? '')

        // Resolve genreId from variety list
        if (recipe.dishVarietyId) {
          setDishVarietyId(recipe.dishVarietyId)
          const matchedVariety = varietyList.find((v) => v.id === recipe.dishVarietyId)
          if (matchedVariety) setGenreId(matchedVariety.genreId)
        }

        // Pre-fill ingredients
        if (recipe.ingredients.length > 0) {
          setIngredients(
            recipe.ingredients.map((ing) => ({
              ingredientId: ing.ingredientId ? Number(ing.ingredientId) : null,
              name: ing.ingredientName ?? '',
              searchQuery: '',
              quantity: String(ing.quantity),
              unit: ing.unit,
            }))
          )
        }

        // Pre-fill steps
        if (recipe.steps.length > 0) {
          setSteps(recipe.steps.map((s) => ({ text: s.description })))
        }

        // Pre-fill tools
        if (recipe.tools.length > 0) {
          setTools(recipe.tools.map((t) => t.name))
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError(t('common.errorRetry'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [id, t])

  const filteredVarieties = genreId
    ? allVarieties.filter((v) => v.genreId === genreId)
    : allVarieties

  async function handleSave() {
    if (!id) return
    setSaveError(null)
    setSaved(false)
    setSaving(true)

    const ingredientPayload: CreateRecipeIngredient[] = ingredients
      .filter(rowComplete)
      .map((r) => ({ ingredientId: r.ingredientId!, quantity: parseQty(r.quantity)!, unit: r.unit.trim() }))

    const stepsPayload = steps
      .filter((s) => s.text.trim())
      .map((s, i) => ({ stepOrder: i + 1, description: s.text.trim() }))

    const toolsPayload = tools
      .filter((t) => t.trim())
      .map((t) => ({ name: t.trim() }))

    try {
      await recipeService.update(id, {
        title: title.trim(),
        story: story.trim() || undefined,
        type,
        dishVarietyId: dishVarietyId ? Number(dishVarietyId) : undefined,
        servingSize: servingSize ? Number(servingSize) : undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        ingredients: ingredientPayload,
        steps: stepsPayload,
        tools: toolsPayload,
      })
      setSaved(true)
    } catch {
      setSaveError(t('edit.saveError'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="edit-recipe__loading">
        <span className="edit-recipe__spinner" aria-hidden />
        <p>{t('edit.loading')}</p>
      </div>
    )
  }

  if (loadError) {
    return <p className="edit-recipe__load-error">{loadError}</p>
  }

  const anyInvalid = ingredients.some(rowInvalid)

  return (
    <div className="edit-recipe">
      <div className="edit-recipe__header">
        <button
          type="button"
          className="edit-recipe__back"
          onClick={() => navigate('/library')}
        >
          ←
        </button>
        <h1 className="edit-recipe__title">{t('edit.title')}</h1>
      </div>

      {/* Basic Info */}
      <section className="edit-recipe__section">
        <h2 className="edit-recipe__section-title">{t('edit.sectionBasic')}</h2>

        <div className="edit-recipe__field">
          <label className="edit-recipe__label" htmlFor="er-title">
            {t('create.fields.recipeTitle')} <span className="edit-recipe__required">*</span>
          </label>
          <input
            id="er-title"
            type="text"
            className="edit-recipe__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>

        <div className="edit-recipe__field">
          <label className="edit-recipe__label" htmlFor="er-story">
            {t('create.fields.description')}
          </label>
          <textarea
            id="er-story"
            className="edit-recipe__textarea"
            value={story}
            onChange={(e) => setStory(e.target.value)}
            rows={4}
            maxLength={5000}
          />
        </div>

        <div className="edit-recipe__field">
          <label className="edit-recipe__label" htmlFor="er-genre">
            {t('create.fields.genre')}
          </label>
          <select
            id="er-genre"
            className="edit-recipe__select"
            value={genreId}
            onChange={(e) => { setGenreId(e.target.value); setDishVarietyId('') }}
          >
            <option value="">{t('create.fields.genrePlaceholder')}</option>
            {genres.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className="edit-recipe__field">
          <label className="edit-recipe__label" htmlFor="er-variety">
            {t('create.fields.dishVariety')}
          </label>
          <select
            id="er-variety"
            className="edit-recipe__select"
            value={dishVarietyId}
            onChange={(e) => setDishVarietyId(e.target.value)}
          >
            <option value="">{t('create.fields.dishVarietyPlaceholder')}</option>
            {filteredVarieties.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="edit-recipe__row">
          <div className="edit-recipe__field">
            <label className="edit-recipe__label" htmlFor="er-servings">
              {t('create.fields.servingSize')}
            </label>
            <input
              id="er-servings"
              type="number"
              className="edit-recipe__input edit-recipe__input--sm"
              value={servingSize}
              onChange={(e) => setServingSize(e.target.value)}
              min={1}
              max={100}
              placeholder={t('create.fields.servingSizePlaceholder')}
            />
          </div>

          <div className="edit-recipe__field">
            <label className="edit-recipe__label">{t('create.fields.recipeType')}</label>
            <div className="edit-recipe__type-row">
              {(['community', 'cultural'] as const).map((v) => {
                const disabled = v === 'cultural' && !canCreateCultural
                return (
                  <button
                    key={v}
                    type="button"
                    className={`edit-recipe__type-btn${type === v ? ' edit-recipe__type-btn--active' : ''}${disabled ? ' edit-recipe__type-btn--disabled' : ''}`}
                    onClick={() => !disabled && setType(v)}
                    disabled={disabled}
                  >
                    {t(v === 'community' ? 'create.fields.community' : 'create.fields.cultural')}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="edit-recipe__section">
        <h2 className="edit-recipe__section-title">{t('create.fields.location')}</h2>
        <div className="edit-recipe__location-row">
          <input
            type="text"
            className="edit-recipe__input"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t('create.fields.countryPlaceholder')}
          />
          <input
            type="text"
            className="edit-recipe__input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('create.fields.cityPlaceholder')}
          />
          <input
            type="text"
            className="edit-recipe__input"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder={t('create.fields.districtPlaceholder')}
          />
        </div>
      </section>

      {/* Ingredients */}
      <section className="edit-recipe__section">
        <h2 className="edit-recipe__section-title">{t('create.ingredients.title')}</h2>
        <div className="edit-recipe__ingredient-list">
          {ingredients.map((row, idx) => (
            <div key={idx} className="edit-recipe__ingredient-row">
              <div className="edit-recipe__ingredient-picker">
                <IngredientPicker
                  ingredientId={row.ingredientId}
                  name={row.name}
                  onChange={(ingId, ingName) =>
                    setIngredients((prev) =>
                      prev.map((r, i) =>
                        i === idx ? { ...r, ingredientId: ingId, name: ingName, searchQuery: '' } : r
                      )
                    )
                  }
                  onSearchInputChange={(text) =>
                    setIngredients((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, searchQuery: text } : r))
                    )
                  }
                />
              </div>
              <input
                type="number"
                className="edit-recipe__input edit-recipe__input--qty"
                value={row.quantity}
                onChange={(e) =>
                  setIngredients((prev) =>
                    prev.map((r, i) => (i === idx ? { ...r, quantity: e.target.value } : r))
                  )
                }
                placeholder={t('create.ingredients.quantityPlaceholder')}
                min={0}
                aria-label={t('create.ingredients.quantityAria')}
              />
              <div className="edit-recipe__unit-picker">
                <UnitPicker
                  value={row.unit}
                  onChange={(unit) =>
                    setIngredients((prev) =>
                      prev.map((r, i) => (i === idx ? { ...r, unit } : r))
                    )
                  }
                />
              </div>
              <button
                type="button"
                className="edit-recipe__remove-btn"
                onClick={() =>
                  setIngredients((prev) => prev.filter((_, i) => i !== idx))
                }
                aria-label={t('create.ingredients.removeAria')}
                disabled={ingredients.length === 1}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="edit-recipe__add-btn"
          onClick={() =>
            setIngredients((prev) => [
              ...prev,
              { ingredientId: null, name: '', searchQuery: '', quantity: '', unit: '' },
            ])
          }
        >
          <PlusIcon /> {t('create.ingredients.add')}
        </button>
      </section>

      {/* Steps */}
      <section className="edit-recipe__section">
        <h2 className="edit-recipe__section-title">{t('create.instructions.title')}</h2>
        <div className="edit-recipe__step-list">
          {steps.map((step, idx) => (
            <div key={idx} className="edit-recipe__step-row">
              <span className="edit-recipe__step-num">{idx + 1}</span>
              <textarea
                className="edit-recipe__textarea"
                value={step.text}
                onChange={(e) =>
                  setSteps((prev) =>
                    prev.map((s, i) => (i === idx ? { text: e.target.value } : s))
                  )
                }
                rows={2}
                placeholder={t('create.instructions.stepPlaceholder')}
              />
              <button
                type="button"
                className="edit-recipe__remove-btn"
                onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                aria-label={t('create.instructions.removeAria')}
                disabled={steps.length === 1}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="edit-recipe__add-btn"
          onClick={() => setSteps((prev) => [...prev, { text: '' }])}
        >
          <PlusIcon /> {t('create.instructions.addStep')}
        </button>
      </section>

      {/* Tools */}
      <section className="edit-recipe__section">
        <h2 className="edit-recipe__section-title">{t('create.tools.title')}</h2>
        <div className="edit-recipe__tool-list">
          {tools.map((tool, idx) => (
            <div key={idx} className="edit-recipe__tool-row">
              <ToolPicker
                value={tool}
                onChange={(val) =>
                  setTools((prev) => prev.map((t, i) => (i === idx ? val : t)))
                }
              />
              <button
                type="button"
                className="edit-recipe__remove-btn"
                onClick={() => setTools((prev) => prev.filter((_, i) => i !== idx))}
                aria-label={t('create.tools.removeAria')}
                disabled={tools.length === 1}
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="edit-recipe__add-btn"
          onClick={() => setTools((prev) => [...prev, ''])}
        >
          <PlusIcon /> {t('create.tools.add')}
        </button>
      </section>

      {/* Save bar */}
      <div className="edit-recipe__save-bar">
        {saveError && <p className="edit-recipe__save-error">{saveError}</p>}
        {saved && <p className="edit-recipe__save-success">{t('edit.saveSuccess')}</p>}
        <div className="edit-recipe__save-actions">
          <button
            type="button"
            className="edit-recipe__cancel-btn"
            onClick={() => navigate('/library')}
          >
            {t('edit.cancel')}
          </button>
          <button
            type="button"
            className="edit-recipe__save-btn"
            disabled={saving || !title.trim() || anyInvalid}
            onClick={handleSave}
          >
            {saving ? t('edit.saving') : t('edit.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
