import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { discoveryService, type DishVariety } from '@/services/discovery-service'
import { recipeService } from '@/services/recipe-service'
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
interface Ingredient { name: string; amount: string }
interface StepItem { text: string }

interface RecipeDraft {
  title: string
  story: string
  type: RecipeType
  dishVarietyId: string
  servingSize: string
  ingredients: Ingredient[]
  tools: string[]
  steps: StepItem[]
}

const INITIAL_DRAFT: RecipeDraft = {
  title: '',
  story: '',
  type: 'community',
  dishVarietyId: '',
  servingSize: '',
  ingredients: [{ name: '', amount: '' }],
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
  const [varieties, setVarieties] = useState<DishVariety[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [pendingMediaFiles, setPendingMediaFiles] = useState<File[]>([])
  const [mediaPickError, setMediaPickError] = useState<string | null>(null)

  // Cook can only create community; expert can create both
  const canCreateCultural = role === 'expert'

  useEffect(() => {
    discoveryService.getVarieties().then(setVarieties).catch(() => {/* non-fatal */})
  }, [])

  // ── Draft helpers ────────────────────────────────────────────────────────────

  const set = <K extends keyof RecipeDraft>(key: K, value: RecipeDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  // ingredients
  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) =>
    setDraft((d) => {
      const list = [...d.ingredients]
      list[idx] = { ...list[idx], [field]: value }
      return { ...d, ingredients: list }
    })
  const addIngredient = () =>
    setDraft((d) => ({ ...d, ingredients: [...d.ingredients, { name: '', amount: '' }] }))
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
      const created = await recipeService.create({
        title: draft.title.trim(),
        story: draft.story.trim() || undefined,
        type: draft.type,
        dishVarietyId: draft.dishVarietyId ? Number(draft.dishVarietyId) : undefined,
        servingSize: draft.servingSize ? Number(draft.servingSize) : undefined,
        steps: draft.steps
          .filter((s) => s.text.trim())
          .map((s, i) => ({ stepOrder: i + 1, description: s.text.trim() })),
        tools: draft.tools
          .filter((t) => t.trim())
          .map((t) => ({ name: t.trim() })),
        // Ingredients: backend requires ingredientId (DB FK) — no ingredient lookup
        // API available yet, so they are not submitted. Future work: add GET /ingredients.
        isPublished: publish,
      })
      recipeCreated = true

      if (pendingMediaFiles.length > 0) {
        for (const file of pendingMediaFiles) {
          const uploaded = await mediaService.uploadFile(file)
          await mediaService.attachRecipeMedia(created.id, {
            url: uploaded.url,
            type: uploaded.type,
          })
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
      setSubmitting(false)
    }
  }

  // ── Navigation guards ────────────────────────────────────────────────────────

  const canContinueStep1 = draft.title.trim().length >= 3
  const canContinueStep3 = draft.steps.some((s) => s.text.trim().length > 0)

  const goNext = () => {
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
        <button type="button" className="cr-header__back" onClick={goBack} aria-label="Back">
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
                {t('create.fields.description')}
              </label>
              <textarea
                id="cr-story"
                className="cr-textarea"
                value={draft.story}
                onChange={(e) => set('story', e.target.value)}
                placeholder={t('create.fields.descriptionPlaceholder')}
                maxLength={5000}
                rows={4}
              />
            </div>

            {/* Dish Variety */}
            <div className="cr-field">
              <label className="cr-label" htmlFor="cr-variety">
                {t('create.fields.dishVariety')}
              </label>
              <select
                id="cr-variety"
                className="cr-select"
                value={draft.dishVarietyId}
                onChange={(e) => set('dishVarietyId', e.target.value)}
              >
                <option value="">{t('create.fields.dishVarietyPlaceholder')}</option>
                {varieties.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.genre ? `${v.genre.name}: ${v.name}` : v.name}
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
              <p className="cr-media__hint">{t('create.media.hint')}</p>
              <div className="cr-media__row">
                <label className="cr-media__choose">
                  <input
                    type="file"
                    className="cr-media__input"
                    accept="image/jpeg,image/png,image/webp,video/mp4"
                    multiple
                    disabled={submitting}
                    onChange={handleMediaFilesChange}
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
              <div className="cr-list">
                {draft.ingredients.map((ing, idx) => (
                  <div key={idx} className="cr-ingredient-row">
                    <input
                      type="text"
                      className="cr-input cr-input--flex"
                      value={ing.name}
                      onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                      placeholder={t('create.ingredients.namePlaceholder')}
                    />
                    <input
                      type="text"
                      className="cr-input cr-input--amount"
                      value={ing.amount}
                      onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                      placeholder={t('create.ingredients.amountPlaceholder')}
                    />
                    {draft.ingredients.length > 1 && (
                      <button
                        type="button"
                        className="cr-trash-btn"
                        onClick={() => removeIngredient(idx)}
                        aria-label="Remove ingredient"
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
                    <input
                      type="text"
                      className="cr-input cr-input--flex"
                      value={tool}
                      onChange={(e) => updateTool(idx, e.target.value)}
                      placeholder={t('create.tools.placeholder')}
                    />
                    {draft.tools.length > 1 && (
                      <button
                        type="button"
                        className="cr-trash-btn"
                        onClick={() => removeTool(idx)}
                        aria-label="Remove tool"
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
                        aria-label="Remove step"
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
                    {draft.ingredients.filter((i) => i.name.trim()).length} {t('create.review.items')}
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

      {/* ── Fixed bottom action bar ───────────────────────────────────────── */}
      <div className="cr-actions">
        {step < 4 ? (
          <button
            type="button"
            className="cr-btn cr-btn--primary"
            onClick={goNext}
            disabled={step === 1 && !canContinueStep1}
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
