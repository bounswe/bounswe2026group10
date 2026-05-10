import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { useAppSelector } from '@/store/hooks'
import { recipeService, type MyRecipeSummary } from '@/services/recipe-service'
import { favoriteService, type FavoriteRecipe } from '@/services/favorite-service'
import './ProfilePage.css'

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  )
}

export function ProfilePage() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const profile = useAppSelector((s) => s.profile)

  const [recipes, setRecipes] = useState<MyRecipeSummary[]>([])
  const [recipesLoading, setRecipesLoading] = useState(true)
  const [drafts, setDrafts] = useState<MyRecipeSummary[]>([])
  const [draftsLoading, setDraftsLoading] = useState(true)
  const [draftActionError, setDraftActionError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([])
  const [favoritesTotal, setFavoritesTotal] = useState(0)
  const [favoritesLoading, setFavoritesLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    recipeService.getMyRecipes('published')
      .then((data) => { if (!cancelled) setRecipes(data) })
      .catch(() => { if (!cancelled) setRecipes([]) })
      .finally(() => { if (!cancelled) setRecipesLoading(false) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    recipeService.listDrafts()
      .then((data) => { if (!cancelled) setDrafts(data) })
      .catch(() => { if (!cancelled) setDrafts([]) })
      .finally(() => { if (!cancelled) setDraftsLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handlePublishDraft = async (id: string) => {
    if (!window.confirm(t('profileScreen.draftPublishConfirm'))) return
    setDraftActionError(null)
    try {
      await recipeService.publish(id)
      const updated = await recipeService.listDrafts()
      setDrafts(updated)
      const published = await recipeService.getMyRecipes('published')
      setRecipes(published)
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data as any)?.error?.message
        : null
      setDraftActionError(msg || t('profileScreen.draftPublished'))
    }
  }

  const handleDeleteDraft = async (id: string) => {
    if (!window.confirm(t('profileScreen.draftDeleteConfirm'))) return
    setDraftActionError(null)
    try {
      await recipeService.delete(id)
      setDrafts((prev) => prev.filter((d) => d.id !== id))
    } catch {
      setDraftActionError(t('profileScreen.draftDeleted'))
    }
  }

  useEffect(() => {
    let cancelled = false
    favoriteService.list(1, 5)
      .then((data) => {
        if (!cancelled) {
          setFavorites(data.recipes)
          setFavoritesTotal(data.pagination.total)
        }
      })
      .catch(() => { if (!cancelled) setFavorites([]) })
      .finally(() => { if (!cancelled) setFavoritesLoading(false) })
    return () => { cancelled = true }
  }, [])

  const publishedRecipes = recipes
  const recentPublished = publishedRecipes.slice(0, 5)

  const initials = profile.username
    ? profile.username.slice(0, 2).toUpperCase()
    : '??'

  const roleLabel = profile.role ? t(`app.roles.${profile.role}`) : '—'

  const isLoading = profile.status === 'loading' || profile.status === 'idle'

  if (isLoading) {
    return (
      <div className="profile-page__loading">
        <span className="profile-page__spinner" aria-hidden />
      </div>
    )
  }

  return (
    <div className="profile-page">

      {/* ── User card ── */}
      <div className="profile-page__card">
        <div className="profile-page__avatar">{initials}</div>
        <div className="profile-page__info">
          <h1 className="profile-page__username">{profile.username ?? '—'}</h1>
          <p className="profile-page__email">{profile.email ?? '—'}</p>
          <span className={`profile-page__role-badge profile-page__role-badge--${profile.role ?? 'learner'}`}>
            {roleLabel}
          </span>
        </div>
      </div>

      {/* ── Stats ── */}
      {!recipesLoading && !draftsLoading && (
        <div className="profile-page__stats">
          <div className="profile-page__stat">
            <span className="profile-page__stat-val">{publishedRecipes.length + drafts.length}</span>
            <span className="profile-page__stat-label">{t('profileScreen.statTotal')}</span>
          </div>
          <div className="profile-page__stat-divider" />
          <div className="profile-page__stat">
            <span className="profile-page__stat-val">{publishedRecipes.length}</span>
            <span className="profile-page__stat-label">{t('profileScreen.statPublished')}</span>
          </div>
          <div className="profile-page__stat-divider" />
          <div className="profile-page__stat">
            <span className="profile-page__stat-val">{drafts.length}</span>
            <span className="profile-page__stat-label">{t('profileScreen.statDraft')}</span>
          </div>
        </div>
      )}

      {/* ── Drafts ── */}
      {!draftsLoading && (
        <section className="profile-page__section">
          <h2 className="profile-page__section-title">{t('profileScreen.drafts')}</h2>
          {draftActionError && (
            <p className="profile-page__error">{draftActionError}</p>
          )}
          {drafts.length === 0 ? (
            <p className="profile-page__empty">{t('profileScreen.noDrafts')}</p>
          ) : (
            <div className="profile-page__draft-list">
              {drafts.map((draft) => (
                <div key={draft.id} className="profile-page__draft-card">
                  <div className="profile-page__draft-thumb">
                    {draft.coverImageUrl
                      ? <img src={draft.coverImageUrl} alt={draft.title} loading="lazy" />
                      : <div className="profile-page__recipe-placeholder" />
                    }
                  </div>
                  <div className="profile-page__draft-body">
                    <p className="profile-page__recipe-title">{draft.title}</p>
                    <span className={`profile-page__type profile-page__type--${draft.type}`}>
                      {t(draft.type === 'cultural' ? 'library.typeCultural' : 'library.typeCommunity')}
                    </span>
                  </div>
                  <div className="profile-page__draft-actions">
                    <button
                      type="button"
                      className="profile-page__draft-btn profile-page__draft-btn--edit"
                      onClick={() => navigate(`/recipes/${draft.id}/edit`)}
                    >
                      {t('profileScreen.draftEdit')}
                    </button>
                    <button
                      type="button"
                      className="profile-page__draft-btn profile-page__draft-btn--publish"
                      onClick={() => void handlePublishDraft(draft.id)}
                    >
                      {t('profileScreen.draftPublish')}
                    </button>
                    <button
                      type="button"
                      className="profile-page__draft-btn profile-page__draft-btn--delete"
                      onClick={() => void handleDeleteDraft(draft.id)}
                    >
                      {t('profileScreen.draftDelete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Recent published recipes ── */}
      {!recipesLoading && publishedRecipes.length > 0 && (
        <section className="profile-page__section">
          <h2 className="profile-page__section-title">{t('profileScreen.recentRecipes')}</h2>
          <div className="profile-page__recipe-list">
            {recentPublished.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                className="profile-page__recipe-card"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <div className="profile-page__recipe-thumb">
                  {recipe.coverImageUrl
                    ? <img src={recipe.coverImageUrl} alt={recipe.title} loading="lazy" />
                    : <div className="profile-page__recipe-placeholder" />
                  }
                </div>
                <div className="profile-page__recipe-body">
                  <p className="profile-page__recipe-title">{recipe.title}</p>
                  <div className="profile-page__recipe-meta">
                    <span className={`profile-page__type profile-page__type--${recipe.type}`}>
                      {t(recipe.type === 'cultural' ? 'library.typeCultural' : 'library.typeCommunity')}
                    </span>
                    {recipe.averageRating !== null && (
                      <span className="profile-page__rating">
                        <StarIcon />
                        {recipe.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {publishedRecipes.length > 5 && (
            <button
              type="button"
              className="profile-page__see-all"
              onClick={() => navigate('/library')}
            >
              {t('profileScreen.seeAll', { count: publishedRecipes.length })}
            </button>
          )}
        </section>
      )}

      {!recipesLoading && publishedRecipes.length === 0 && (
        <p className="profile-page__empty">{t('profileScreen.noRecipes')}</p>
      )}

      {/* ── Favorites ── */}
      {!favoritesLoading && favorites.length > 0 && (
        <section className="profile-page__section">
          <h2 className="profile-page__section-title">{t('profileScreen.favorites')}</h2>
          <div className="profile-page__recipe-list">
            {favorites.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                className="profile-page__recipe-card"
                onClick={() => navigate(`/recipes/${recipe.id}`)}
              >
                <div className="profile-page__recipe-thumb">
                  {recipe.coverImageUrl
                    ? <img src={recipe.coverImageUrl} alt={recipe.title} loading="lazy" />
                    : <div className="profile-page__recipe-placeholder" />
                  }
                </div>
                <div className="profile-page__recipe-body">
                  <p className="profile-page__recipe-title">{recipe.title}</p>
                  <div className="profile-page__recipe-meta">
                    <span className={`profile-page__type profile-page__type--${recipe.type}`}>
                      {t(recipe.type === 'cultural' ? 'library.typeCultural' : 'library.typeCommunity')}
                    </span>
                    {recipe.averageRating !== null && (
                      <span className="profile-page__rating">
                        <StarIcon />
                        {recipe.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          {favoritesTotal > 5 && (
            <button
              type="button"
              className="profile-page__see-all"
              onClick={() => navigate('/library?tab=favorites')}
            >
              {t('profileScreen.seeAllFavorites', { count: favoritesTotal })}
            </button>
          )}
        </section>
      )}

      {!favoritesLoading && favorites.length === 0 && (
        <p className="profile-page__empty">{t('profileScreen.noFavorites')}</p>
      )}
    </div>
  )
}
