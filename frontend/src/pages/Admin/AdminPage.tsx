import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isAxiosError } from 'axios'
import { adminService } from '@/services/admin-service'
import type {
  AdminUser,
  AdminUserUpdate,
  ApproveCulturalTagPayload,
  ApproveDishGenrePayload,
  ApproveDishVarietyPayload,
  ContentRequestStatus,
  CulturalTagRequest,
  CulturalTagRequestStatus,
  DishGenreRequest,
  DishVarietyRequest,
  ExpertRequest,
  ExpertRequestStatus,
} from '@/services/types/admin'
import type { UserRole } from '@/services/types/auth'
import { ConfirmModal } from '@/components/ConfirmModal/ConfirmModal'
import { ExpertRequestRow } from '@/pages/Admin/Parts/ExpertRequestRow'
import { UserRow } from '@/pages/Admin/Parts/UserRow'
import { DecisionDialog } from '@/pages/Admin/Parts/DecisionDialog'
import { EditUserDialog } from '@/pages/Admin/Parts/EditUserDialog'
import { CulturalTagRequestRow } from '@/pages/Admin/Parts/CulturalTagRequestRow'
import { ApproveCulturalTagDialog } from '@/pages/Admin/Parts/ApproveCulturalTagDialog'
import { ContentRequestRow } from '@/pages/Admin/Parts/ContentRequestRow'
import { ApproveContentRequestDialog } from '@/pages/Admin/Parts/ApproveContentRequestDialog'
import './AdminPage.css'

type Tab = 'requests' | 'users' | 'culturalTags' | 'contentRequests'

type Toast = { id: number; kind: 'success' | 'error'; message: string }

interface Pending<T> {
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  data: T | null
  error: string | null
}

function initial<T>(): Pending<T> {
  return { status: 'idle', data: null, error: null }
}

function extractError(err: unknown, fallback: string): string {
  if (isAxiosError(err) && err.response?.data?.error?.message) {
    return err.response.data.error.message as string
  }
  if (err instanceof Error) {
    return err.message
  }
  return fallback
}

const STATUSES: ExpertRequestStatus[] = ['pending', 'approved', 'rejected']
const TAG_STATUSES: CulturalTagRequestStatus[] = ['pending', 'approved', 'rejected']
const CONTENT_STATUSES: ContentRequestStatus[] = ['pending', 'approved', 'rejected']
const ROLES_FOR_FILTER: UserRole[] = ['learner', 'cook', 'expert', 'admin']
const PAGE_LIMIT = 20

export function AdminPage() {
  const { t } = useTranslation('common')
  const [tab, setTab] = useState<Tab>('requests')
  const [toasts, setToasts] = useState<Toast[]>([])

  // ── Toast helpers ────────────────────────────────────────────────────────
  const pushToast = useCallback((kind: Toast['kind'], message: string) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, kind, message }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  // ─────────────────────────────────────────────────────────────────────────
  // Expert Requests tab
  // ─────────────────────────────────────────────────────────────────────────
  const [requestStatus, setRequestStatus] = useState<ExpertRequestStatus>('pending')
  const [requestPage, setRequestPage] = useState(1)
  const [requests, setRequests] = useState<Pending<ExpertRequest[]>>(initial())
  const [requestTotal, setRequestTotal] = useState(0)

  const [decisionFor, setDecisionFor] = useState<{
    request: ExpertRequest
    action: 'approve' | 'reject'
  } | null>(null)
  const [decisionBusy, setDecisionBusy] = useState(false)

  const reloadRequests = useCallback(async () => {
    setRequests((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const result = await adminService.listExpertRequests({
        status: requestStatus,
        page: requestPage,
        limit: PAGE_LIMIT,
      })
      setRequests({ status: 'succeeded', data: result.requests, error: null })
      setRequestTotal(result.pagination.total)
    } catch (err) {
      setRequests({
        status: 'failed',
        data: null,
        error: extractError(err, t('admin.errors.loadRequests')),
      })
    }
  }, [requestStatus, requestPage, t])

  useEffect(() => {
    if (tab === 'requests') {
      void reloadRequests()
    }
  }, [tab, reloadRequests])

  async function handleDecide(decisionNote: string) {
    if (!decisionFor) return
    const { request, action } = decisionFor
    setDecisionBusy(true)
    try {
      if (action === 'approve') {
        await adminService.approveExpertRequest(request.id, { decisionNote: decisionNote || undefined })
        pushToast('success', t('admin.requests.approvedToast', { username: request.applicant?.username ?? '' }))
      } else {
        await adminService.rejectExpertRequest(request.id, { decisionNote: decisionNote || undefined })
        pushToast('success', t('admin.requests.rejectedToast', { username: request.applicant?.username ?? '' }))
      }
      setDecisionFor(null)
      await reloadRequests()
    } catch (err) {
      pushToast('error', extractError(err, t('admin.errors.decisionFailed')))
    } finally {
      setDecisionBusy(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Users tab
  // ─────────────────────────────────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState('')
  const [userSearchInput, setUserSearchInput] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState<UserRole | ''>('')
  const [userPage, setUserPage] = useState(1)
  const [users, setUsers] = useState<Pending<AdminUser[]>>(initial())
  const [userTotal, setUserTotal] = useState(0)

  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [editBusy, setEditBusy] = useState(false)

  const [pendingDelete, setPendingDelete] = useState<AdminUser | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const reloadUsers = useCallback(async () => {
    setUsers((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const result = await adminService.listUsers({
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
        page: userPage,
        limit: PAGE_LIMIT,
      })
      setUsers({ status: 'succeeded', data: result.users, error: null })
      setUserTotal(result.pagination.total)
    } catch (err) {
      setUsers({
        status: 'failed',
        data: null,
        error: extractError(err, t('admin.errors.loadUsers')),
      })
    }
  }, [userSearch, userRoleFilter, userPage, t])

  useEffect(() => {
    if (tab === 'users') {
      void reloadUsers()
    }
  }, [tab, reloadUsers])

  async function handleSaveUser(updates: AdminUserUpdate) {
    if (!editing) return
    setEditBusy(true)
    try {
      await adminService.updateUser(editing.id, updates)
      pushToast('success', t('admin.users.updatedToast', { username: editing.username }))
      setEditing(null)
      await reloadUsers()
    } catch (err) {
      pushToast('error', extractError(err, t('admin.errors.updateFailed')))
    } finally {
      setEditBusy(false)
    }
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return
    setDeleteBusy(true)
    try {
      await adminService.deleteUser(pendingDelete.id)
      pushToast('success', t('admin.users.deletedToast', { username: pendingDelete.username }))
      setPendingDelete(null)
      await reloadUsers()
    } catch (err) {
      pushToast('error', extractError(err, t('admin.errors.deleteFailed')))
    } finally {
      setDeleteBusy(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Cultural Tag Requests tab
  // ─────────────────────────────────────────────────────────────────────────
  const [tagStatus, setTagStatus] = useState<CulturalTagRequestStatus>('pending')
  const [tagPage, setTagPage] = useState(1)
  const [tagRequests, setTagRequests] = useState<Pending<CulturalTagRequest[]>>(initial())
  const [tagTotal, setTagTotal] = useState(0)

  const [approvingTag, setApprovingTag] = useState<CulturalTagRequest | null>(null)
  const [rejectingTag, setRejectingTag] = useState<CulturalTagRequest | null>(null)
  const [tagDecisionBusy, setTagDecisionBusy] = useState(false)

  const reloadTagRequests = useCallback(async () => {
    setTagRequests((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const result = await adminService.listCulturalTagRequests({
        status: tagStatus,
        page: tagPage,
        limit: PAGE_LIMIT,
      })
      setTagRequests({ status: 'succeeded', data: result.requests, error: null })
      setTagTotal(result.pagination.total)
    } catch (err) {
      setTagRequests({
        status: 'failed',
        data: null,
        error: extractError(err, t('admin.errors.loadCulturalTagRequests')),
      })
    }
  }, [tagStatus, tagPage, t])

  useEffect(() => {
    if (tab === 'culturalTags') {
      void reloadTagRequests()
    }
  }, [tab, reloadTagRequests])

  async function handleApproveTag(payload: ApproveCulturalTagPayload) {
    if (!approvingTag) return
    setTagDecisionBusy(true)
    try {
      await adminService.approveCulturalTagRequest(approvingTag.id, payload)
      pushToast('success', t('admin.culturalTags.approvedToast', { labelEn: payload.labelEn ?? approvingTag.labelEn ?? '' }))
      setApprovingTag(null)
      await reloadTagRequests()
    } catch (err) {
      pushToast('error', extractError(err, t('admin.errors.tagDecisionFailed')))
    } finally {
      setTagDecisionBusy(false)
    }
  }

  async function handleRejectTag(decisionNote: string) {
    if (!rejectingTag) return
    setTagDecisionBusy(true)
    try {
      await adminService.rejectCulturalTagRequest(rejectingTag.id, { decisionNote: decisionNote || undefined })
      pushToast('success', t('admin.culturalTags.rejectedToast'))
      setRejectingTag(null)
      await reloadTagRequests()
    } catch (err) {
      pushToast('error', extractError(err, t('admin.errors.tagDecisionFailed')))
    } finally {
      setTagDecisionBusy(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Content Requests tab (dish genres + varieties)
  // ─────────────────────────────────────────────────────────────────────────
  const [contentSubtype, setContentSubtype] = useState<'genre' | 'variety'>('genre')
  const [contentStatus, setContentStatus] = useState<ContentRequestStatus>('pending')
  const [contentPage, setContentPage] = useState(1)
  const [genreRequests, setGenreRequests] = useState<Pending<DishGenreRequest[]>>(initial())
  const [genreTotal, setGenreTotal] = useState(0)
  const [varietyRequests, setVarietyRequests] = useState<Pending<DishVarietyRequest[]>>(initial())
  const [varietyTotal, setVarietyTotal] = useState(0)

  const [approvingContent, setApprovingContent] = useState<DishGenreRequest | DishVarietyRequest | null>(null)
  const [rejectingContent, setRejectingContent] = useState<DishGenreRequest | DishVarietyRequest | null>(null)
  const [contentDecisionBusy, setContentDecisionBusy] = useState(false)

  const reloadGenreRequests = useCallback(async () => {
    setGenreRequests((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const result = await adminService.listDishGenreRequests({
        status: contentStatus,
        page: contentPage,
        limit: PAGE_LIMIT,
      })
      setGenreRequests({ status: 'succeeded', data: result.requests, error: null })
      setGenreTotal(result.pagination.total)
    } catch (err) {
      setGenreRequests({
        status: 'failed',
        data: null,
        error: extractError(err, t('admin.errors.loadContentRequests')),
      })
    }
  }, [contentStatus, contentPage, t])

  const reloadVarietyRequests = useCallback(async () => {
    setVarietyRequests((s) => ({ ...s, status: 'loading', error: null }))
    try {
      const result = await adminService.listDishVarietyRequests({
        status: contentStatus,
        page: contentPage,
        limit: PAGE_LIMIT,
      })
      setVarietyRequests({ status: 'succeeded', data: result.requests, error: null })
      setVarietyTotal(result.pagination.total)
    } catch (err) {
      setVarietyRequests({
        status: 'failed',
        data: null,
        error: extractError(err, t('admin.errors.loadContentRequests')),
      })
    }
  }, [contentStatus, contentPage, t])

  useEffect(() => {
    if (tab === 'contentRequests') {
      if (contentSubtype === 'genre') void reloadGenreRequests()
      else void reloadVarietyRequests()
    }
  }, [tab, contentSubtype, reloadGenreRequests, reloadVarietyRequests])

  async function handleApproveContent(payload: ApproveDishGenrePayload | ApproveDishVarietyPayload) {
    if (!approvingContent) return
    setContentDecisionBusy(true)
    try {
      if (contentSubtype === 'genre') {
        await adminService.approveDishGenreRequest(approvingContent.id, payload as ApproveDishGenrePayload)
        pushToast('success', t('admin.contentRequests.approvedGenreToast', { nameEn: (payload as ApproveDishGenrePayload).nameEn ?? approvingContent.nameEn ?? '' }))
        setApprovingContent(null)
        await reloadGenreRequests()
      } else {
        await adminService.approveDishVarietyRequest(approvingContent.id, payload as ApproveDishVarietyPayload)
        pushToast('success', t('admin.contentRequests.approvedVarietyToast', { nameEn: (payload as ApproveDishVarietyPayload).nameEn ?? approvingContent.nameEn ?? '' }))
        setApprovingContent(null)
        await reloadVarietyRequests()
      }
    } catch (err) {
      pushToast('error', extractError(err, t('admin.errors.contentDecisionFailed')))
    } finally {
      setContentDecisionBusy(false)
    }
  }

  async function handleRejectContent(decisionNote: string) {
    if (!rejectingContent) return
    setContentDecisionBusy(true)
    try {
      if (contentSubtype === 'genre') {
        await adminService.rejectDishGenreRequest(rejectingContent.id, { decisionNote: decisionNote || undefined })
        await reloadGenreRequests()
      } else {
        await adminService.rejectDishVarietyRequest(rejectingContent.id, { decisionNote: decisionNote || undefined })
        await reloadVarietyRequests()
      }
      pushToast('success', t('admin.contentRequests.rejectedToast'))
      setRejectingContent(null)
    } catch (err) {
      pushToast('error', extractError(err, t('admin.errors.contentDecisionFailed')))
    } finally {
      setContentDecisionBusy(false)
    }
  }

  // Pagination labels are tiny enough to compute inline.
  const requestTotalPages = Math.max(1, Math.ceil(requestTotal / PAGE_LIMIT))
  const userTotalPages = Math.max(1, Math.ceil(userTotal / PAGE_LIMIT))
  const tagTotalPages = Math.max(1, Math.ceil(tagTotal / PAGE_LIMIT))
  const genreTotalPages = Math.max(1, Math.ceil(genreTotal / PAGE_LIMIT))
  const varietyTotalPages = Math.max(1, Math.ceil(varietyTotal / PAGE_LIMIT))

  const isApproveAction = decisionFor?.action === 'approve'
  const decisionTitle = useMemo(() => {
    if (!decisionFor) return ''
    const username = decisionFor.request.applicant?.username ?? ''
    return isApproveAction
      ? t('admin.requests.approveTitle', { username })
      : t('admin.requests.rejectTitle', { username })
  }, [decisionFor, isApproveAction, t])

  return (
    <div className="admin-page">
      <header className="admin-page__header">
        <div>
          <h1 className="admin-page__title">{t('admin.title')}</h1>
          <p className="admin-page__subtitle">{t('admin.subtitle')}</p>
        </div>
      </header>

      <nav className="admin-tabs" role="tablist" aria-label={t('admin.tabsAria')}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'requests'}
          className={`admin-tab ${tab === 'requests' ? 'admin-tab--active' : ''}`}
          onClick={() => setTab('requests')}
        >
          {t('admin.tabs.requests')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'users'}
          className={`admin-tab ${tab === 'users' ? 'admin-tab--active' : ''}`}
          onClick={() => setTab('users')}
        >
          {t('admin.tabs.users')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'culturalTags'}
          className={`admin-tab ${tab === 'culturalTags' ? 'admin-tab--active' : ''}`}
          onClick={() => setTab('culturalTags')}
        >
          {t('admin.tabs.culturalTags')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'contentRequests'}
          className={`admin-tab ${tab === 'contentRequests' ? 'admin-tab--active' : ''}`}
          onClick={() => setTab('contentRequests')}
        >
          {t('admin.tabs.contentRequests')}
        </button>
      </nav>

      {tab === 'requests' && (
        <section className="admin-section" aria-labelledby="admin-requests-h">
          <h2 id="admin-requests-h" className="sr-only">
            {t('admin.tabs.requests')}
          </h2>

          <div className="admin-toolbar">
            <div className="admin-chip-row" role="tablist" aria-label={t('admin.requests.statusAria')}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={requestStatus === s}
                  className={`admin-chip ${requestStatus === s ? 'admin-chip--active' : ''}`}
                  onClick={() => {
                    setRequestStatus(s)
                    setRequestPage(1)
                  }}
                >
                  {t(`admin.requests.status.${s}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => void reloadRequests()}
              disabled={requests.status === 'loading'}
            >
              {t('admin.refresh')}
            </button>
          </div>

          {requests.status === 'loading' && (
            <div className="admin-empty"><span className="ui-spinner" /></div>
          )}
          {requests.status === 'failed' && (
            <div className="admin-empty admin-empty--error">{requests.error}</div>
          )}
          {requests.status === 'succeeded' && requests.data?.length === 0 && (
            <div className="admin-empty">{t('admin.requests.empty')}</div>
          )}
          {requests.status === 'succeeded' && requests.data && requests.data.length > 0 && (
            <ul className="admin-list">
              {requests.data.map((r) => (
                <ExpertRequestRow
                  key={r.id}
                  request={r}
                  onApprove={() => setDecisionFor({ request: r, action: 'approve' })}
                  onReject={() => setDecisionFor({ request: r, action: 'reject' })}
                />
              ))}
            </ul>
          )}

          <Pagination
            page={requestPage}
            totalPages={requestTotalPages}
            onPrev={() => setRequestPage((p) => Math.max(1, p - 1))}
            onNext={() => setRequestPage((p) => Math.min(requestTotalPages, p + 1))}
            label={t('admin.pagination.label', { page: requestPage, total: requestTotalPages })}
          />
        </section>
      )}

      {tab === 'users' && (
        <section className="admin-section" aria-labelledby="admin-users-h">
          <h2 id="admin-users-h" className="sr-only">
            {t('admin.tabs.users')}
          </h2>

          <form
            className="admin-toolbar"
            onSubmit={(e) => {
              e.preventDefault()
              setUserSearch(userSearchInput.trim())
              setUserPage(1)
            }}
            role="search"
          >
            <input
              type="search"
              className="admin-input"
              placeholder={t('admin.users.searchPlaceholder')}
              aria-label={t('admin.users.searchPlaceholder')}
              value={userSearchInput}
              onChange={(e) => setUserSearchInput(e.target.value)}
            />
            <select
              className="admin-input"
              value={userRoleFilter}
              onChange={(e) => {
                setUserRoleFilter(e.target.value as UserRole | '')
                setUserPage(1)
              }}
              aria-label={t('admin.users.roleFilterAria')}
            >
              <option value="">{t('admin.users.roleAll')}</option>
              {ROLES_FOR_FILTER.map((r) => (
                <option key={r} value={r}>
                  {t(`app.roles.${r}`)}
                </option>
              ))}
            </select>
            <button type="submit" className="admin-btn admin-btn--primary">
              {t('admin.users.searchSubmit')}
            </button>
          </form>

          {users.status === 'loading' && (
            <div className="admin-empty"><span className="ui-spinner" /></div>
          )}
          {users.status === 'failed' && (
            <div className="admin-empty admin-empty--error">{users.error}</div>
          )}
          {users.status === 'succeeded' && users.data?.length === 0 && (
            <div className="admin-empty">{t('admin.users.empty')}</div>
          )}
          {users.status === 'succeeded' && users.data && users.data.length > 0 && (
            <ul className="admin-list">
              {users.data.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  onEdit={() => setEditing(u)}
                  onDelete={() => setPendingDelete(u)}
                />
              ))}
            </ul>
          )}

          <Pagination
            page={userPage}
            totalPages={userTotalPages}
            onPrev={() => setUserPage((p) => Math.max(1, p - 1))}
            onNext={() => setUserPage((p) => Math.min(userTotalPages, p + 1))}
            label={t('admin.pagination.label', { page: userPage, total: userTotalPages })}
          />
        </section>
      )}

      {tab === 'culturalTags' && (
        <section className="admin-section" aria-labelledby="admin-cultural-tags-h">
          <h2 id="admin-cultural-tags-h" className="sr-only">
            {t('admin.tabs.culturalTags')}
          </h2>

          <div className="admin-toolbar">
            <div className="admin-chip-row" role="tablist" aria-label={t('admin.culturalTags.statusAria')}>
              {TAG_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={tagStatus === s}
                  className={`admin-chip ${tagStatus === s ? 'admin-chip--active' : ''}`}
                  onClick={() => {
                    setTagStatus(s)
                    setTagPage(1)
                  }}
                >
                  {t(`admin.requests.status.${s}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => void reloadTagRequests()}
              disabled={tagRequests.status === 'loading'}
            >
              {t('admin.refresh')}
            </button>
          </div>

          {tagRequests.status === 'loading' && (
            <div className="admin-empty"><span className="ui-spinner" /></div>
          )}
          {tagRequests.status === 'failed' && (
            <div className="admin-empty admin-empty--error">{tagRequests.error}</div>
          )}
          {tagRequests.status === 'succeeded' && tagRequests.data?.length === 0 && (
            <div className="admin-empty">{t('admin.culturalTags.empty')}</div>
          )}
          {tagRequests.status === 'succeeded' && tagRequests.data && tagRequests.data.length > 0 && (
            <ul className="admin-list">
              {tagRequests.data.map((r) => (
                <CulturalTagRequestRow
                  key={r.id}
                  request={r}
                  onApprove={() => setApprovingTag(r)}
                  onReject={() => setRejectingTag(r)}
                />
              ))}
            </ul>
          )}

          <Pagination
            page={tagPage}
            totalPages={tagTotalPages}
            onPrev={() => setTagPage((p) => Math.max(1, p - 1))}
            onNext={() => setTagPage((p) => Math.min(tagTotalPages, p + 1))}
            label={t('admin.pagination.label', { page: tagPage, total: tagTotalPages })}
          />
        </section>
      )}

      {tab === 'contentRequests' && (
        <section className="admin-section" aria-labelledby="admin-content-requests-h">
          <h2 id="admin-content-requests-h" className="sr-only">
            {t('admin.tabs.contentRequests')}
          </h2>

          {/* Sub-type filter */}
          <div className="admin-toolbar">
            <div className="admin-chip-row" role="tablist" aria-label={t('admin.contentRequests.subfilterAria')}>
              {(['genre', 'variety'] as const).map((sub) => (
                <button
                  key={sub}
                  type="button"
                  role="tab"
                  aria-selected={contentSubtype === sub}
                  className={`admin-chip ${contentSubtype === sub ? 'admin-chip--active' : ''}`}
                  onClick={() => {
                    setContentSubtype(sub)
                    setContentPage(1)
                  }}
                >
                  {t(`admin.contentRequests.subfilter.${sub}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="admin-toolbar">
            <div className="admin-chip-row" role="tablist" aria-label={t('admin.contentRequests.statusAria')}>
              {CONTENT_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={contentStatus === s}
                  className={`admin-chip ${contentStatus === s ? 'admin-chip--active' : ''}`}
                  onClick={() => {
                    setContentStatus(s)
                    setContentPage(1)
                  }}
                >
                  {t(`admin.requests.status.${s}`)}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => {
                if (contentSubtype === 'genre') void reloadGenreRequests()
                else void reloadVarietyRequests()
              }}
              disabled={
                contentSubtype === 'genre'
                  ? genreRequests.status === 'loading'
                  : varietyRequests.status === 'loading'
              }
            >
              {t('admin.refresh')}
            </button>
          </div>

          {/* Genre requests list */}
          {contentSubtype === 'genre' && (
            <>
              {genreRequests.status === 'loading' && (
                <div className="admin-empty"><span className="ui-spinner" /></div>
              )}
              {genreRequests.status === 'failed' && (
                <div className="admin-empty admin-empty--error">{genreRequests.error}</div>
              )}
              {genreRequests.status === 'succeeded' && genreRequests.data?.length === 0 && (
                <div className="admin-empty">{t('admin.contentRequests.empty')}</div>
              )}
              {genreRequests.status === 'succeeded' && genreRequests.data && genreRequests.data.length > 0 && (
                <ul className="admin-list">
                  {genreRequests.data.map((r) => (
                    <ContentRequestRow
                      key={r.id}
                      type="genre"
                      request={r}
                      onApprove={() => setApprovingContent(r)}
                      onReject={() => setRejectingContent(r)}
                    />
                  ))}
                </ul>
              )}
              <Pagination
                page={contentPage}
                totalPages={genreTotalPages}
                onPrev={() => setContentPage((p) => Math.max(1, p - 1))}
                onNext={() => setContentPage((p) => Math.min(genreTotalPages, p + 1))}
                label={t('admin.pagination.label', { page: contentPage, total: genreTotalPages })}
              />
            </>
          )}

          {/* Variety requests list */}
          {contentSubtype === 'variety' && (
            <>
              {varietyRequests.status === 'loading' && (
                <div className="admin-empty"><span className="ui-spinner" /></div>
              )}
              {varietyRequests.status === 'failed' && (
                <div className="admin-empty admin-empty--error">{varietyRequests.error}</div>
              )}
              {varietyRequests.status === 'succeeded' && varietyRequests.data?.length === 0 && (
                <div className="admin-empty">{t('admin.contentRequests.empty')}</div>
              )}
              {varietyRequests.status === 'succeeded' && varietyRequests.data && varietyRequests.data.length > 0 && (
                <ul className="admin-list">
                  {varietyRequests.data.map((r) => (
                    <ContentRequestRow
                      key={r.id}
                      type="variety"
                      request={r}
                      onApprove={() => setApprovingContent(r)}
                      onReject={() => setRejectingContent(r)}
                    />
                  ))}
                </ul>
              )}
              <Pagination
                page={contentPage}
                totalPages={varietyTotalPages}
                onPrev={() => setContentPage((p) => Math.max(1, p - 1))}
                onNext={() => setContentPage((p) => Math.min(varietyTotalPages, p + 1))}
                label={t('admin.pagination.label', { page: contentPage, total: varietyTotalPages })}
              />
            </>
          )}
        </section>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {decisionFor && (
        <DecisionDialog
          title={decisionTitle}
          confirmLabel={
            isApproveAction
              ? t('admin.requests.approveConfirm')
              : t('admin.requests.rejectConfirm')
          }
          confirmVariant={isApproveAction ? 'primary' : 'danger'}
          busy={decisionBusy}
          onCancel={() => (decisionBusy ? null : setDecisionFor(null))}
          onSubmit={handleDecide}
        />
      )}

      {approvingTag && (
        <ApproveCulturalTagDialog
          request={approvingTag}
          busy={tagDecisionBusy}
          onCancel={() => (tagDecisionBusy ? null : setApprovingTag(null))}
          onSubmit={(payload) => void handleApproveTag(payload)}
        />
      )}

      {rejectingTag && (
        <DecisionDialog
          title={t('admin.culturalTags.rejectTitle')}
          confirmLabel={t('admin.culturalTags.rejectConfirm')}
          confirmVariant="danger"
          busy={tagDecisionBusy}
          onCancel={() => (tagDecisionBusy ? null : setRejectingTag(null))}
          onSubmit={(note) => void handleRejectTag(note)}
        />
      )}

      {approvingContent && (
        <ApproveContentRequestDialog
          type={contentSubtype}
          request={approvingContent}
          busy={contentDecisionBusy}
          onCancel={() => (contentDecisionBusy ? null : setApprovingContent(null))}
          onSubmit={(payload) => void handleApproveContent(payload)}
        />
      )}

      {rejectingContent && (
        <DecisionDialog
          title={t('admin.contentRequests.rejectTitle')}
          confirmLabel={t('admin.contentRequests.rejectConfirm')}
          confirmVariant="danger"
          busy={contentDecisionBusy}
          onCancel={() => (contentDecisionBusy ? null : setRejectingContent(null))}
          onSubmit={(note) => void handleRejectContent(note)}
        />
      )}

      {editing && (
        <EditUserDialog
          user={editing}
          busy={editBusy}
          onCancel={() => (editBusy ? null : setEditing(null))}
          onSave={handleSaveUser}
        />
      )}

      <ConfirmModal
        isOpen={pendingDelete !== null}
        title={t('admin.users.deleteTitle')}
        message={
          pendingDelete
            ? t('admin.users.deleteMessage', { username: pendingDelete.username })
            : ''
        }
        confirmLabel={t('admin.users.deleteConfirm')}
        cancelLabel={t('admin.cancel')}
        confirmVariant="danger"
        busy={deleteBusy}
        onCancel={() => (deleteBusy ? null : setPendingDelete(null))}
        onConfirm={() => void handleConfirmDelete()}
      />

      {/* ── Toasts ─────────────────────────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div className="admin-toasts" role="status" aria-live="polite">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`admin-toast admin-toast--${toast.kind}`}
            >
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface PaginationProps {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  label: string
}

function Pagination({ page, totalPages, onPrev, onNext, label }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <nav className="admin-pagination" aria-label="Pagination">
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        onClick={onPrev}
        disabled={page <= 1}
      >
        ‹
      </button>
      <span className="admin-pagination__label">{label}</span>
      <button
        type="button"
        className="admin-btn admin-btn--ghost"
        onClick={onNext}
        disabled={page >= totalPages}
      >
        ›
      </button>
    </nav>
  )
}
