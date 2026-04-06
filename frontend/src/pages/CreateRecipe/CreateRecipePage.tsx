import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { discoveryService, type DishVariety, type Genre } from '@/services/discovery-service'
import { recipeService, type CreateRecipeIngredient } from '@/services/recipe-service'
import { ingredientService, type IngredientOption } from '@/services/ingredient-service'
import { parseService, type ParsedRecipeOutput } from '@/services/parse-service'
import { IngredientPicker } from '@/components/CreateRecipe/IngredientPicker'
import { ToolPicker } from '@/components/CreateRecipe/ToolPicker'
import { UnitPicker } from '@/components/CreateRecipe/UnitPicker'
import { mediaService } from '@/services/media-service'
import { useUserRole } from '@/hooks/useUserRole'
import './CreateRecipePage.css'

/** Aligned with backend `media.ts` */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
const ALLOWED_VIDEO_TYPES = ['video/mp4'] as const
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 100 * 1024 * 1024
const MAX_MEDIA_FILES = 10

function validateMediaFile(file: File): string | null {
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])
  const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_TYPES)[number])
  if (!isImage && !isVideo) {
    return 'create.media.errorType'
  }
  if (isImage && file.size > MAX_IMAGE_SIZE) {
    return 'create.media.errorSizeImage'
  }
  if (isVideo && file.size > MAX_VIDEO_SIZE) {
    return 'create.media.errorSizeVideo'
  }
  return null
}

// ── Local types ────────────────────────────────────────────────────────────────

type RecipeType = 'community' | 'cultural'

/** One row: catalog ingredient + quantity/unit for POST /recipes */
interface IngredientRow {
  ingredientId: number | null
  name: string
  /** Keystrokes in search field (for validation: must pick from API, not free text) */
  searchQuery: string
  quantity: string
  unit: string
}

interface StepItem { text: string }

function parseQuantityValue(quantity: string): number | null {
  const q = parseFloat(String(quantity).replace(',', '.'))
  return Number.isFinite(q) && q > 0 ? q : null
}

function parseRecipeIngredients(rows: IngredientRow[]): CreateRecipeIngredient[] {
  const out: CreateRecipeIngredient[] = []
  for (const row of rows) {
    if (row.ingredientId === null) continue
    const q = parseQuantityValue(row.quantity)
    const unit = row.unit.trim()
    if (q === null || !unit) continue
    out.push({ ingredientId: row.ingredientId, quantity: q, unit })
  }
  return out
}

function ingredientRowIsEmpty(row: IngredientRow): boolean {
  return (
    row.ingredientId === null &&
    !row.searchQuery.trim() &&
    !row.quantity.trim() &&
    !row.unit.trim()
  )
}

function ingredientRowIsComplete(row: IngredientRow): boolean {
  if (row.ingredientId === null) return false
  return parseQuantityValue(row.quantity) !== null && row.unit.trim().length > 0
}

/** Row blocks “Continue” if user started filling without a catalog pick or left qty/unit incomplete */
function ingredientRowIsInvalid(row: IngredientRow): boolean {
  if (ingredientRowIsEmpty(row)) return false
  if (row.ingredientId === null) {
    if (row.searchQuery.trim()) return true
    if (row.quantity.trim() || row.unit.trim()) return true
    return false
  }
  return !ingredientRowIsComplete(row)
}

function ingredientsStepValid(rows: IngredientRow[]): boolean {
  const hasOneComplete = rows.some(ingredientRowIsComplete)
  const anyInvalid = rows.some(ingredientRowIsInvalid)
  return hasOneComplete && !anyInvalid
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase()
}

function uniqueNonEmpty(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))]
}

interface RecipeDraft {
  title: string
  story: string
  type: RecipeType
  /** Selected dish genre (mutfak türü); drives variety list via GET /dish-varieties?genreId= */
  genreId: string
  dishVarietyId: string
  servingSize: string
  country: string
  city: string
  district: string
  ingredients: IngredientRow[]
  tools: string[]
  steps: StepItem[]
}

const INITIAL_DRAFT: RecipeDraft = {
  title: '',
  story: '',
  type: 'community',
  genreId: '',
  dishVarietyId: '',
  servingSize: '',
  country: '',
  city: '',
  district: '',
  ingredients: [{ ingredientId: null, name: '', searchQuery: '', quantity: '', unit: '' }],
  tools: [''],
  steps: [{ text: '' }],
}

// ── Inline SVG icons (no lucide-react in frontend) ─────────────────────────────

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

function ChevronLeftIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15,18 9,12 15,6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="20,6 9,17 4,12" />
    </svg>
  )
}

// ── Progress bar ───────────────────────────────────────────────────────────────

function ProgressBar({ step, label }: { step: number; label: string }) {
  return (
    <div className="cr-progress">
      <div className="cr-progress__bars">
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className={`cr-progress__bar${n <= step ? ' cr-progress__bar--filled' : ''}`}
          />
        ))}
      </div>
      <p className="cr-progress__label">{label}</p>
    </div>
  )
}

// ── Page component ─────────────────────────────────────────────────────────────

export function CreateRecipePage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const role = useUserRole()

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [draft, setDraft] = useState<RecipeDraft>(INITIAL_DRAFT)
  const [genres, setGenres] = useState<Genre[]>([])
  const [varieties, setVarieties] = useState<DishVariety[]>([])
  const [loadingVarieties, setLoadingVarieties] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([])
  const [mediaPickError, setMediaPickError] = useState<string | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [parseText, setParseText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedOutput, setParsedOutput] = useState<ParsedRecipeOutput | null>(null)
  const [unmatchedParsedIngredients, setUnmatchedParsedIngredients] = useState<string[]>([])
  // Cook can only create community; expert can create both
  const canCreateCultural = role === 'expert'

  useEffect(() => {
    discoveryService.getGenres().then(setGenres).catch(() => {
      setGenres([])
    })
  }, [])

  useEffect(() => {
    if (!draft.genreId) {
      setVarieties([])
      setLoadingVarieties(false)
      return
    }
    let cancelled = false
    setLoadingVarieties(true)
    discoveryService
      .getVarieties({ genreId: draft.genreId })
      .then((data) => {
        if (!cancelled) setVarieties(data)
      })
      .catch(() => {
        if (!cancelled) setVarieties([])
      })
      .finally(() => {
        if (!cancelled) setLoadingVarieties(false)
      })
    return () => {
      cancelled = true
    }
  }, [draft.genreId])

  // ── Draft helpers ────────────────────────────────────────────────────────────

  const set = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  // ingredients
  const updateIngredient = (idx: number, patch: Partial<IngredientRow>) =>
    setDraft((d) => {
      const list = [...d.ingredients]
      list[idx] = { ...list[idx], ...patch }
      return { ...d, ingredients: list }
    })
  const addIngredient = () =>
    setDraft((d) => ({
      ...d,
      ingredients: [
        ...d.ingredients,
        { ingredientId: null, name: '', searchQuery: '', quantity: '', unit: '' },
      ],
    }))
  const removeIngredient = (idx: number) =>
    setDraft((d) => ({ ...d, ingredients: d.ingredients.filter((_, i) => i !== idx) }))

  // tools
  const updateTool = (idx: number, value: string) =>
    setDraft((d) => {
      const list = [...d.tools]
      list[idx] = value
      return { ...d, tools: list }
    })
  const addTool = () => setDraft((d) => ({ ...d, tools: [...d.tools, ''] }))
  const removeTool = (idx: number) =>
    setDraft((d) => ({ ...d, tools: d.tools.filter((_, i) => i !== idx) }))

  // steps
  const updateStep = (idx: number, value: string) =>
    setDraft((d) => {
      const list = [...d.steps]
      list[idx] = { text: value }
      return { ...d, steps: list }
    })
  const addStep = () => setDraft((d) => ({ ...d, steps: [...d.steps, { text: '' }] }))
  const removeStep = (idx: number) =>
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== idx) }))

  // ── Submit ───────────────────────────────────────────────────────────────────

  const removePendingMedia = (idx: number) => {
    setPendingMediaFiles((list) => list.filter((_, i) => i !== idx))
    setMediaPickError(null)
  }

  const handleMediaFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaPickError(null)
    const { files } = e.target
    if (!files?.length) {
      e.target.value = ''
      return
    }
    const next: File[] = [...pendingMediaFiles]
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const errKey = validateMediaFile(file)
      if (errKey) {
        setMediaPickError(t(errKey))
        break
      }
      if (next.length >= MAX_MEDIA_FILES) {
        setMediaPickError(t('create.media.errorMaxFiles'))
        break
      }
      next.push(file)
    }
    setPendingMediaFiles(next)
    e.target.value = ''
  }

  const handleSubmit = async (publish: boolean) => {
    setSubmitError(null)
    setMediaPickError(null)
    setSubmitting(true)
    let recipeCreated = false
    try {
      const ingredientsPayload = parseRecipeIngredients(draft.ingredients)
      const created = await recipeService.create({
        title: draft.title.trim(),
        story: draft.story.trim() || undefined,
        type: draft.type,
        dishVarietyId: draft.dishVarietyId ? Number(draft.dishVarietyId) : undefined,
        servingSize: draft.servingSize ? Number(draft.servingSize) : undefined,
        country: draft.country.trim() || undefined,
        city: draft.city.trim() || undefined,
        district: draft.district.trim() || undefined,
        ingredients: ingredientsPayload,
        steps: draft.steps
          .filter((s) => s.text.trim())
          .map((s, i) => ({ stepOrder: i + 1, description: s.text.trim() })),
        tools: draft.tools
          .filter((t) => t.trim())
          .map((t) => ({ name: t.trim() })),
        isPublished: publish,
      })
      recipeCreated = true

      if (pendingMediaFiles.length > 0) {
        setUploadingMedia(true)
        try {
          for (const file of pendingMediaFiles) {
            const uploaded = await mediaService.uploadFile(file)
            await mediaService.attachRecipeMedia(created.id, {
              url: uploaded.url,
              type: uploaded.type,
            })
          }
        } finally {
          setUploadingMedia(false)
        }
      }

      setSuccessMsg(publish ? t('create.successPublished') : t('create.successDraft'))
      setPendingMediaFiles([])
      setTimeout(() => navigate('/home'), 1800)
    } catch (err: unknown) {
      if (recipeCreated) {
        setSubmitError(t('create.media.errorMediaAfterCreate'))
      } else if (isAxiosError(err)) {
        const msg = (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message
        setSubmitError(msg || t('create.errorCreate'))
      } else {
        setSubmitError(t('create.errorCreate'))
      }
    } finally {
      setUploadingMedia(false)
      setSubmitting(false)
    }
  }

  const findBestIngredientMatch = async (name: string): Promise<IngredientOption | null> => {
    const candidates = await ingredientService.search(name)
    if (candidates.length === 0) return null
    const normalized = normalizeName(name)
    const exact = candidates.find((opt) => normalizeName(opt.name) === normalized)
    return exact ?? candidates[0] ?? null
  }

  const handleParseNarrative = async () => {
    if (parseText.trim().length < 10 || parsing) return
    setParsing(true)
    setParseError(null)
    setUnmatchedParsedIngredients([])

    try {
      const parsed = await parseService.parseRecipeText(parseText.trim())
      setParsedOutput(parsed)

      const ingredientMatches = await Promise.all(
        parsed.ingredients.map(async (ing) => {
          try {
            const match = await findBestIngredientMatch(ing.name)
            return { ing, match }
          } catch {
            return { ing, match: null }
          }
        }),
      )

      const matchedRows: IngredientRow[] = ingredientMatches
        .filter((item) => item.match !== null)
        .map((item) => ({
          ingredientId: item.match?.id ?? null,
          name: item.match?.name ?? '',
          searchQuery: '',
          quantity: item.ing.quantity !== null ? String(item.ing.quantity) : '',
          unit: item.ing.unit,
        }))

      const unmatched = uniqueNonEmpty(
        ingredientMatches
          .filter((item) => item.match === null)
          .map((item) => item.ing.name),
      )
      setUnmatchedParsedIngredients(unmatched)

      setDraft((current) => ({
        ...current,
        title: current.title.trim() ? current.title : parsed.title,
        tools: parsed.tools.length > 0 ? parsed.tools : current.tools,
        steps:
          parsed.steps.length > 0
            ? parsed.steps.map((step) => ({ text: step.description }))
            : current.steps,
        ingredients: matchedRows.length > 0 ? matchedRows : current.ingredients,
      }))
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const msg = (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message
        setParseError(msg || t('create.parse.error'))
      } else {
        setParseError(t('create.parse.error'))
      }
      setParsedOutput(null)
    } finally {
      setParsing(false)
    }
  }

  // ── Navigation guards ────────────────────────────────────────────────────────

  const canContinueStep1 = draft.title.trim().length >= 3
  const canContinueStep2 = ingredientsStepValid(draft.ingredients)
  const canContinueStep3 = draft.steps.some((s) => s.text.trim().length > 0)

  const goNext = () => {
    if (step === 2 && !ingredientsStepValid(draft.ingredients)) return
    if (step < 4) setStep((s) => (s + 1) as typeof step)
  }
  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as typeof step)
    else navigate(-1)
  }

  // ── Success screen ───────────────────────────────────────────────────────────

  if (successMsg) {
    return (
      <div className="cr-success">
        <div className="cr-success__icon"><CheckIcon /></div>
        <p className="cr-success__msg">{successMsg}</p>
      </div>
    )
  }

  // ── Step labels ───────────────────────────────────────────────────────────────

  const stepLabels: Record<1 | 2 | 3 | 4, string> = {
    1: t('create.stepLabel', { step: 1, label: t('create.steps.1') }),
    2: t('create.stepLabel', { step: 2, label: t('create.steps.2') }),
    3: t('create.stepLabel', { step: 3, label: t('create.steps.3') }),
    4: t('create.stepLabel', { step: 4, label: t('create.steps.4') }),
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="cr-page">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="cr-header">
        <button type="button" className="cr-header__back" onClick={goBack} aria-label={t('common.goBack')}>
          <ChevronLeftIcon />
        </button>
        <h2 className="cr-header__title">
          {step === 4 ? t('create.review.title') : t('create.title')}
        </h2>
        <button
          type="button"
          className="cr-header__draft"
          onClick={() => handleSubmit(false)}
          disabled={submitting || !canContinueStep1}
        >
          {t('create.saveDraft')}
        </button>
      </div>

      {/* ── Progress ─────────────────────────────────────────────────────── */}
      <ProgressBar step={step} label={stepLabels[step]} />

      {/* ── Step content ─────────────────────────────────────────────────── */}
      <div className="cr-body">

        {/* ── STEP 1: Basic Info ──────────────────────────────────────────── */}
        {step === 1 && (
          <div className="cr-section">
            <div className="cr-field cr-parse">
              <label className="cr-label" htmlFor="cr-parse-text">
                {t('create.parse.label')}
              </label>
              <textarea
                id="cr-parse-text"
                className="cr-textarea"
                value={parseText}
                onChange={(e) => setParseText(e.target.value)}
                placeholder={t('create.parse.placeholder')}
                rows={6}
                maxLength={5000}
              />
              <div className="cr-parse__actions">
                <button
                  type="button"
                  className="cr-add-btn"
                  disabled={parsing || parseText.trim().length < 10}
                  onClick={handleParseNarrative}
                >
                  {parsing ? t('create.parse.parsing') : t('create.parse.parseButton')}
                </button>
                <span className="cr-parse__hint">{t('create.parse.hint')}</span>
              </div>
              {parseError && <p className="cr-error cr-error--inline">{parseError}</p>}

              {parsedOutput && (
                <div className="cr-parse-preview" role="status" aria-live="polite">
                  <p className="cr-parse-preview__title">{t('create.parse.previewTitle')}</p>
                  <p className="cr-parse-preview__line">
                    {t('create.parse.previewSummary', {
                      ingredients: parsedOutput.ingredients.length,
                      tools: parsedOutput.tools.length,
                      steps: parsedOutput.steps.length,
                    })}
                  </p>
                  {unmatchedParsedIngredients.length > 0 && (
                    <p className="cr-parse-preview__line cr-parse-preview__line--warn">
                      {t('create.parse.unmatchedIngredients', {
                        count: unmatchedParsedIngredients.length,
                        names: unmatchedParsedIngredients.join(', '),
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div className="cr-field">
              <label className="cr-label" htmlFor="cr-title">
                {t('create.fields.recipeTitle')} <span className="cr-required">*</span>
              </label>
              <input
                id="cr-title"
                type="text"
                className="cr-input"
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder={t('create.fields.recipeTitlePlaceholder')}
                maxLength={200}
              />
            </div>

            {/* Description / Story */}
            <div className="cr-field">
              <label className="cr-label" htmlFor="cr-story">
                {t('create.fields.story')}
              </label>
              <textarea
                id="cr-story"
                className="cr-textarea"
                value={draft.story}
                onChange={(e) => set('story', e.target.value)}
                placeholder={t('create.fields.storyPlaceholder')}
                maxLength={5000}
                rows={4}
              />
            </div>

            {/* Genre → Variety (two-step; varieties loaded per genre) */}
            <div className="cr-field">
              <label className="cr-label" htmlFor="cr-genre">
                {t('create.fields.genre')}
              </label>
              <select
                id="cr-genre"
                className="cr-select"
                value={draft.genreId}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, genreId: e.target.value, dishVarietyId: '' }))
                }
              >
                <option value="">{t('create.fields.genrePlaceholder')}</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="cr-field">
              <label className="cr-label" htmlFor="cr-variety">
                {t('create.fields.dishVariety')}
              </label>
              <select
                id="cr-variety"
                className="cr-select"
                value={draft.dishVarietyId}
                onChange={(e) => set('dishVarietyId', e.target.value)}
                disabled={!draft.genreId || loadingVarieties}
                aria-busy={loadingVarieties}
              >
                <option value="">
                  {!draft.genreId
                    ? t('create.fields.dishVarietyNeedGenre')
                    : loadingVarieties
                      ? t('create.fields.varietiesLoading')
                      : t('create.fields.dishVarietyPlaceholder')}
                </option>
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Serving Size */}
            <div className="cr-field cr-field--half">
              <label className="cr-label" htmlFor="cr-servings">
                {t('create.fields.servingSize')}
              </label>
              <input
                id="cr-servings"
                type="number"
                className="cr-input"
                value={draft.servingSize}
                onChange={(e) => set('servingSize', e.target.value)}
                placeholder={t('create.fields.servingSizePlaceholder')}
                min={1}
                max={100}
              />
            </div>

            {/* Location */}
            <div className="cr-field">
              <label className="cr-label">{t('create.fields.location')}</label>
              <div className="cr-location-row">
                <input
                  type="text"
                  className="cr-input"
                  value={draft.country}
                  onChange={(e) => set('country', e.target.value)}
                  placeholder={t('create.fields.countryPlaceholder')}
                />
                <input
                  type="text"
                  className="cr-input"
                  value={draft.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder={t('create.fields.cityPlaceholder')}
                />
                <input
                  type="text"
                  className="cr-input"
                  value={draft.district}
                  onChange={(e) => set('district', e.target.value)}
                  placeholder={t('create.fields.districtPlaceholder')}
                />
              </div>
            </div>

            {/* Recipe Type */}
            <div className="cr-field">
              <label className="cr-label">{t('create.fields.recipeType')}</label>
              <div className="cr-type-options">
                {([
                  { value: 'community', title: t('create.fields.community'), desc: t('create.fields.communityDesc') },
                  { value: 'cultural',  title: t('create.fields.cultural'),  desc: t('create.fields.culturalDesc') },
                ] as const).map(({ value, title, desc }) => {
                  const disabled = value === 'cultural' && !canCreateCultural
                  return (
                    <button
                      key={value}
                      type="button"
                      className={`cr-type-opt${draft.type === value ? ' cr-type-opt--active' : ''}${disabled ? ' cr-type-opt--disabled' : ''}`}
                      onClick={() => !disabled && set('type', value)}
                      aria-pressed={draft.type === value}
                      disabled={disabled}
                    >
                      <span className="cr-type-opt__title">{title}</span>
                      <span className="cr-type-opt__desc">
                        {disabled ? t('create.fields.expertOnly') : desc}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Photos & video (upload after recipe is created) */}
            <div className="cr-field cr-media">
              <span className="cr-label">{t('create.media.title')}</span>
              <p id="cr-media-hint" className="cr-media__hint">
                {t('create.media.hint')}
              </p>
              <div className="cr-media__row">
                <label className="cr-media__choose" htmlFor="cr-media-input">
                  <input
                    id="cr-media-input"
                    type="file"
                    className="cr-media__input"
                    accept="image/jpeg,image/png,image/webp,video/mp4"
                    multiple
                    disabled={submitting}
                    onChange={handleMediaFilesChange}
                    aria-describedby="cr-media-hint"
                    aria-label={t('create.media.chooseAria')}
                  />
                  <span className="cr-media__choose-btn">{t('create.media.chooseFiles')}</span>
                </label>
              </div>
              {mediaPickError && <p className="cr-error cr-error--inline">{mediaPickError}</p>}
              {pendingMediaFiles.length > 0 && (
                <ul className="cr-media__list">
                  {pendingMediaFiles.map((file, idx) => (
                    <li key={`${file.name}-${file.size}-${idx}`} className="cr-media__item">
                      <span className="cr-media__name">{file.name}</span>
                      <button
                        type="button"
                        className="cr-trash-btn"
                        onClick={() => removePendingMedia(idx)}
                        aria-label={t('create.media.removeAria')}
                      >
                        <TrashIcon />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 2: Ingredients & Tools ──────────────────────────────────── */}
        {step === 2 && (
          <div className="cr-section">
            {/* Ingredients */}
            <div className="cr-block">
              <div className="cr-block__header">
                <h3 className="cr-block__title">{t('create.ingredients.title')}</h3>
                <button type="button" className="cr-add-btn" onClick={addIngredient}>
                  <PlusIcon />{t('create.ingredients.add')}
                </button>
              </div>
              <p className="cr-info-note">{t('create.ingredients.infoNote')}</p>
              {!canContinueStep2 && (
                <p className="cr-info-note cr-info-note--warn" role="status">
                  {draft.ingredients.some(ingredientRowIsInvalid)
                    ? t('create.ingredients.continueHint')
                    : t('create.ingredients.needAtLeastOne')}
                </p>
              )}
              <div className="cr-list">
                {draft.ingredients.map((ing, idx) => (
                  <div key={idx} className="cr-ingredient-row">
                    <IngredientPicker
                      ingredientId={ing.ingredientId}
                      name={ing.name}
                      onChange={(ingredientId, name) =>
                        updateIngredient(idx, {
                          ingredientId,
                          name,
                          ...(ingredientId !== null ? { searchQuery: '' } : {}),
                        })
                      }
                      onSearchInputChange={(text) => updateIngredient(idx, { searchQuery: text })}
                      disabled={submitting}
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      className="cr-input cr-input--amount"
                      value={ing.quantity}
                      onChange={(e) => updateIngredient(idx, { quantity: e.target.value })}
                      placeholder={t('create.ingredients.quantityPlaceholder')}
                      disabled={submitting}
                      aria-label={t('create.ingredients.quantityAria')}
                    />
                    <UnitPicker
                      value={ing.unit}
                      onChange={(unit) => updateIngredient(idx, { unit })}
                      disabled={submitting}
                    />
                    {draft.ingredients.length > 1 && (
                      <button
                        type="button"
                        className="cr-trash-btn"
                        onClick={() => removeIngredient(idx)}
                        aria-label={t('create.ingredients.removeAria')}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tools */}
            <div className="cr-block">
              <div className="cr-block__header">
                <h3 className="cr-block__title">{t('create.tools.title')}</h3>
                <button type="button" className="cr-add-btn" onClick={addTool}>
                  <PlusIcon />{t('create.tools.add')}
                </button>
              </div>
              <div className="cr-list">
                {draft.tools.map((tool, idx) => (
                  <div key={idx} className="cr-row">
                    <ToolPicker
                      value={tool}
                      onChange={(name) => updateTool(idx, name)}
                      disabled={submitting}
                    />
                    {draft.tools.length > 1 && (
                      <button
                        type="button"
                        className="cr-trash-btn"
                        onClick={() => removeTool(idx)}
                        aria-label={t('create.tools.removeAria')}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 3: Instructions ──────────────────────────────────────────── */}
        {step === 3 && (
          <div className="cr-section">
            <div className="cr-block">
              <div className="cr-block__header">
                <h3 className="cr-block__title">{t('create.instructions.title')}</h3>
                <button type="button" className="cr-add-btn" onClick={addStep}>
                  <PlusIcon />{t('create.instructions.addStep')}
                </button>
              </div>
              <div className="cr-list">
                {draft.steps.map((s, idx) => (
                  <div key={idx} className="cr-step-row">
                    <div className="cr-step-card">
                      <div className="cr-step-card__num">{idx + 1}</div>
                      <textarea
                        className="cr-textarea cr-textarea--inline"
                        value={s.text}
                        onChange={(e) => updateStep(idx, e.target.value)}
                        placeholder={t('create.instructions.stepPlaceholder')}
                        rows={3}
                      />
                    </div>
                    {draft.steps.length > 1 && (
                      <button
                        type="button"
                        className="cr-trash-btn"
                        onClick={() => removeStep(idx)}
                        aria-label={t('create.instructions.removeAria')}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 4: Review & Publish ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="cr-section">
            {/* Preview card */}
            <div className="cr-review-card">
              <div className="cr-review-card__ready">
                <CheckIcon />
                <span>{t('create.review.readyToPublish')}</span>
              </div>

              <h3 className="cr-review-card__title">{draft.title}</h3>

              <div className="cr-review-card__meta">
                <span className={`cr-badge cr-badge--${draft.type}`}>
                  {draft.type.toUpperCase()}
                </span>
                {genres.find((g) => g.id === draft.genreId) && (
                  <span className="cr-review-card__genre">{genres.find((g) => g.id === draft.genreId)?.name}</span>
                )}
                {varieties.find((v) => v.id === draft.dishVarietyId) && (
                  <span className="cr-review-card__variety">
                    {varieties.find((v) => v.id === draft.dishVarietyId)?.name}
                  </span>
                )}
                {draft.servingSize && (
                  <span className="cr-review-card__servings">
                    {t('create.review.servings', { count: Number(draft.servingSize) })}
                  </span>
                )}
                {(draft.country || draft.city) && (
                  <span className="cr-review-card__location">
                    {[draft.district, draft.city, draft.country].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>

              {draft.story && (
                <p className="cr-review-card__story">{draft.story}</p>
              )}

              <div className="cr-review-card__divider" />

              <div className="cr-review-counts">
                {pendingMediaFiles.length > 0 && (
                  <div className="cr-review-count cr-review-count--full">
                    <span className="cr-review-count__label">{t('create.media.title')}</span>
                    <span className="cr-review-count__val">
                      {t('create.media.reviewCount', { count: pendingMediaFiles.length })}
                    </span>
                  </div>
                )}
                <div className="cr-review-count">
                  <span className="cr-review-count__label">{t('create.review.ingredients')}</span>
                  <span className="cr-review-count__val">
                    {parseRecipeIngredients(draft.ingredients).length} {t('create.review.items')}
                  </span>
                </div>
                <div className="cr-review-count">
                  <span className="cr-review-count__label">{t('create.review.tools')}</span>
                  <span className="cr-review-count__val">
                    {draft.tools.filter((t) => t.trim()).length} {t('create.review.items')}
                  </span>
                </div>
                <div className="cr-review-count">
                  <span className="cr-review-count__label">{t('create.review.steps')}</span>
                  <span className="cr-review-count__val">
                    {draft.steps.filter((s) => s.text.trim()).length} {t('create.review.stepsUnit')}
                  </span>
                </div>
              </div>
            </div>

            {/* Publication note */}
            <div className="cr-review-note">
              <p>{t('create.review.note')}</p>
            </div>

            {submitError && <p className="cr-error">{submitError}</p>}
          </div>
        )}
      </div>

      {submitting && uploadingMedia && (
        <div className="cr-media-status" role="status" aria-live="polite">
          {t('create.media.uploading')}
        </div>
      )}

      {/* ── Fixed bottom action bar ───────────────────────────────────────── */}
      <div className="cr-actions">
        {step < 4 ? (
          <button
            type="button"
            className="cr-btn cr-btn--primary"
            onClick={goNext}
            disabled={
              (step === 1 && !canContinueStep1) ||
              (step === 2 && !canContinueStep2) ||
              (step === 3 && !canContinueStep3)
            }
          >
            {t('create.continue')}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="cr-btn cr-btn--primary"
              onClick={() => handleSubmit(true)}
              disabled={submitting || !canContinueStep3}
              aria-busy={submitting}
            >
              {submitting ? <span className="ui-spinner" aria-hidden /> : t('create.review.publish')}
            </button>
            <button
              type="button"
              className="cr-btn cr-btn--secondary"
              onClick={() => handleSubmit(false)}
              disabled={submitting}
            >
              {t('create.review.saveDraft')}
            </button>
          </>
        )}
      </div>

    </div>
  )
}
