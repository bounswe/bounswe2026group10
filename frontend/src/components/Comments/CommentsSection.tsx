import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { commentService, type Comment } from '@/services/comment-service'
import { useAppSelector } from '@/store/hooks'
import './Comments.css'

interface Props {
  recipeId: string
  isOwnRecipe: boolean
  myRatingScore: number | null
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="comments__form-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`comments__form-star${(hovered || value) >= n ? ' comments__form-star--filled' : ''}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(value === n ? 0 : n)}
          aria-label={`${n} star`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function CommentsSection({ recipeId, isOwnRecipe, myRatingScore }: Props) {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const currentUserId = useAppSelector((s) => s.profile.userId)

  const [comments, setComments] = useState<Comment[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [body, setBody] = useState('')
  const [score, setScore] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const LIMIT = 10

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    commentService.list(recipeId, 1, LIMIT)
      .then((data) => {
        if (!cancelled) {
          setComments(data.comments)
          setTotal(data.pagination.total)
          setPage(1)
        }
      })
      .catch(() => { if (!cancelled) setComments([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [recipeId])

  async function handleLoadMore() {
    const nextPage = page + 1
    setLoadingMore(true)
    try {
      const data = await commentService.list(recipeId, nextPage, LIMIT)
      setComments((prev) => [...prev, ...data.comments])
      setPage(nextPage)
    } catch {
      // ignore
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setFormError(null)
    setSubmitting(true)
    try {
      const newComment = await commentService.create(
        recipeId,
        body.trim(),
        !isOwnRecipe && score > 0 ? score : undefined
      )
      setComments((prev) => [newComment, ...prev])
      setTotal((n) => n + 1)
      setBody('')
      setScore(0)
    } catch (err) {
      if (isAxiosError(err)) {
        const code = (err.response?.data as { error?: { code?: string } } | undefined)?.error?.code
        if (code === 'RATING_REQUIRED') {
          setFormError(t('comments.ratingRequired'))
        } else {
          setFormError(t('comments.submitError'))
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await commentService.remove(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
      setTotal((n) => n - 1)
    } catch {
      // ignore
    }
  }

  const hasMore = comments.length < total

  return (
    <div className="comments">
      <h2 className="comments__title">
        {t('comments.title')} {total > 0 && `(${total})`}
      </h2>

      {/* Comment list */}
      {loading ? (
        <p className="comments__empty">{t('common.loading')}</p>
      ) : comments.length === 0 ? (
        <p className="comments__empty">{t('comments.empty')}</p>
      ) : (
        <div className="comments__list">
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <div className="comment-item__header">
                <div className="comment-item__meta">
                  <span className="comment-item__username">{c.username}</span>
                  <span className="comment-item__date">{formatDate(c.createdAt)}</span>
                </div>
                {String(c.userId) === String(currentUserId) && (
                  <button
                    type="button"
                    className="comment-item__delete"
                    onClick={() => void handleDelete(c.id)}
                  >
                    {t('comments.delete')}
                  </button>
                )}
              </div>
              <p className="comment-item__body">{c.body}</p>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <button
          type="button"
          className="comments__load-more"
          onClick={() => void handleLoadMore()}
          disabled={loadingMore}
        >
          {loadingMore ? t('common.loading') : t('comments.loadMore')}
        </button>
      )}

      {/* Comment form */}
      {!isAuthenticated ? (
        <p className="comments__login-prompt">
          {t('comments.loginPrompt')}{' '}
          <button type="button" className="comments__login-link" onClick={() => navigate('/login')}>
            {t('comments.loginLink')}
          </button>
        </p>
      ) : (
        <form className="comments__form" onSubmit={(e) => void handleSubmit(e)}>
          {!isOwnRecipe && myRatingScore === null && (
            <div className="comments__form-rating">
              <span className="comments__form-rating-label">{t('comments.rateLabel')}</span>
              <StarInput value={score} onChange={setScore} />
            </div>
          )}
          <textarea
            className="comments__textarea"
            placeholder={t('comments.placeholder')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            required
          />
          {formError && <p className="comments__form-error">{formError}</p>}
          <div className="comments__form-actions">
            <button
              type="submit"
              className="comments__submit"
              disabled={submitting || !body.trim()}
            >
              {submitting ? t('common.loading') : t('comments.submit')}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
