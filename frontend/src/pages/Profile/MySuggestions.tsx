import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  culturalTagRequest,
  dishGenreRequest,
  dishVarietyRequest,
  type MyCulturalTagRequest,
  type MyDishGenreRequest,
  type MyDishVarietyRequest,
} from '@/services/content-request-service'
import { discoveryService, type Genre } from '@/services/discovery-service'
import { SuggestionModal, type SuggestionKind } from '@/components/SuggestionModal/SuggestionModal'
import './MySuggestions.css'

type TabKey = 'cultural' | 'genre' | 'variety'

function formatDate(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return ''
  }
}

function pickLabel(en: string | null, tr: string | null, lang: string): string {
  if (lang.startsWith('tr')) return tr ?? en ?? ''
  return en ?? tr ?? ''
}

export function MySuggestions() {
  const { t, i18n } = useTranslation('common')
  const [activeTab, setActiveTab] = useState<TabKey>('cultural')
  const [cultural, setCultural] = useState<MyCulturalTagRequest[] | null>(null)
  const [genres, setGenres] = useState<MyDishGenreRequest[] | null>(null)
  const [varieties, setVarieties] = useState<MyDishVarietyRequest[] | null>(null)
  /** Modal state — null = closed; otherwise the kind to render. */
  const [suggestModal, setSuggestModal] = useState<SuggestionKind | null>(null)
  /** Inline confirmation shown briefly after a suggestion is submitted. */
  const [suggestSent, setSuggestSent] = useState(false)
  /** Options needed by the modal (lazy-fetched once). */
  const [genreOptions, setGenreOptions] = useState<Genre[]>([])
  const [countryOptions, setCountryOptions] = useState<string[]>([])

  const refreshActiveTab = useCallback(async (tab: TabKey) => {
    try {
      if (tab === 'cultural') setCultural(await culturalTagRequest.listMine())
      else if (tab === 'genre') setGenres(await dishGenreRequest.listMine())
      else setVarieties(await dishVarietyRequest.listMine())
    } catch {
      /* keep existing data on transient failure */
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.allSettled([
      culturalTagRequest.listMine(),
      dishGenreRequest.listMine(),
      dishVarietyRequest.listMine(),
      discoveryService.getGenres(),
      discoveryService.getLocations(),
    ]).then((results) => {
      if (cancelled) return
      setCultural(results[0].status === 'fulfilled' ? results[0].value : [])
      setGenres(results[1].status === 'fulfilled' ? results[1].value : [])
      setVarieties(results[2].status === 'fulfilled' ? results[2].value : [])
      setGenreOptions(results[3].status === 'fulfilled' ? results[3].value : [])
      setCountryOptions(
        results[4].status === 'fulfilled' ? results[4].value.countries : [],
      )
    })
    return () => {
      cancelled = true
    }
  }, [])

  function handleSuggestSuccess() {
    const tab = suggestModal
    setSuggestModal(null)
    setSuggestSent(true)
    window.setTimeout(() => setSuggestSent(false), 4000)
    if (tab) void refreshActiveTab(tab)
  }

  const tabs: Array<{ key: TabKey; label: string; count: number | null }> = useMemo(
    () => [
      { key: 'cultural', label: t('profileScreen.suggestions.tabCultural'), count: cultural?.length ?? null },
      { key: 'genre', label: t('profileScreen.suggestions.tabGenre'), count: genres?.length ?? null },
      { key: 'variety', label: t('profileScreen.suggestions.tabVariety'), count: varieties?.length ?? null },
    ],
    [t, cultural, genres, varieties],
  )

  const lang = i18n.language

  function renderStatus(status: 'pending' | 'approved' | 'rejected') {
    return (
      <span className={`my-suggestions__status my-suggestions__status--${status}`}>
        {t(`profileScreen.suggestions.status${status[0].toUpperCase()}${status.slice(1)}`)}
      </span>
    )
  }

  function renderNote(note: string | null) {
    if (!note) return null
    return (
      <p className="my-suggestions__note">
        <span className="my-suggestions__note-label">
          {t('profileScreen.suggestions.decisionNote')}
        </span>{' '}
        {note}
      </p>
    )
  }

  function renderMeta(item: { createdAt: string; decidedAt: string | null }) {
    const dateIso = item.decidedAt ?? item.createdAt
    const key = item.decidedAt ? 'profileScreen.suggestions.decidedOn' : 'profileScreen.suggestions.submittedOn'
    return (
      <span className="my-suggestions__item-meta">
        {t(key, { date: formatDate(dateIso, lang) })}
      </span>
    )
  }

  return (
    <section className="profile-page__section">
      <div className="my-suggestions__header">
        <h2 className="profile-page__section-title">{t('profileScreen.suggestions.title')}</h2>
        <button
          type="button"
          className="my-suggestions__new-btn"
          onClick={() => setSuggestModal(activeTab)}
        >
          + {t('profileScreen.suggestions.newButton')}
        </button>
      </div>

      {suggestSent && (
        <div className="my-suggestions__success-banner" role="status" aria-live="polite">
          ✓ {t('create.suggestionSent')}
        </div>
      )}

      <div className="my-suggestions__tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`my-suggestions__tab${activeTab === tab.key ? ' my-suggestions__tab--active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count != null && tab.count > 0 && ` (${tab.count})`}
          </button>
        ))}
      </div>

      {activeTab === 'cultural' && (
        cultural == null ? (
          <p className="my-suggestions__loading">{t('common.loading')}</p>
        ) : cultural.length === 0 ? (
          <p className="my-suggestions__empty">{t('profileScreen.suggestions.emptyCultural')}</p>
        ) : (
          <div className="my-suggestions__list">
            {cultural.map((r) => (
              <article key={r.id} className="my-suggestions__item">
                <div className="my-suggestions__item-header">
                  <h3 className="my-suggestions__item-name">
                    {pickLabel(r.labelEn, r.labelTr, lang)}
                    {r.country && ` · ${r.country}`}
                  </h3>
                  {renderStatus(r.status)}
                </div>
                {renderMeta(r)}
                {renderNote(r.decisionNote)}
              </article>
            ))}
          </div>
        )
      )}

      {activeTab === 'genre' && (
        genres == null ? (
          <p className="my-suggestions__loading">{t('common.loading')}</p>
        ) : genres.length === 0 ? (
          <p className="my-suggestions__empty">{t('profileScreen.suggestions.emptyGenre')}</p>
        ) : (
          <div className="my-suggestions__list">
            {genres.map((r) => (
              <article key={r.id} className="my-suggestions__item">
                <div className="my-suggestions__item-header">
                  <h3 className="my-suggestions__item-name">
                    {pickLabel(r.nameEn, r.nameTr, lang)}
                  </h3>
                  {renderStatus(r.status)}
                </div>
                {renderMeta(r)}
                {renderNote(r.decisionNote)}
              </article>
            ))}
          </div>
        )
      )}

      {activeTab === 'variety' && (
        varieties == null ? (
          <p className="my-suggestions__loading">{t('common.loading')}</p>
        ) : varieties.length === 0 ? (
          <p className="my-suggestions__empty">{t('profileScreen.suggestions.emptyVariety')}</p>
        ) : (
          <div className="my-suggestions__list">
            {varieties.map((r) => (
              <article key={r.id} className="my-suggestions__item">
                <div className="my-suggestions__item-header">
                  <h3 className="my-suggestions__item-name">
                    {pickLabel(r.nameEn, r.nameTr, lang)}
                  </h3>
                  {renderStatus(r.status)}
                </div>
                {renderMeta(r)}
                {renderNote(r.decisionNote)}
              </article>
            ))}
          </div>
        )
      )}

      <SuggestionModal
        kind={suggestModal ?? 'cultural'}
        isOpen={suggestModal !== null}
        onClose={() => setSuggestModal(null)}
        onSuccess={handleSuggestSuccess}
        countryOptions={countryOptions}
        genreOptions={genreOptions.map((g) => ({ id: g.id, name: g.name }))}
      />
    </section>
  )
}
