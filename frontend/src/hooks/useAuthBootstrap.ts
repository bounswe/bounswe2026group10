import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { session } from '@/auth/session'
import { fetchProfileAsync, selectProfileStatus } from '@/store/slices/profile-slice'

/**
 * Fetches `GET /auth/me` when a token exists and profile is still `idle` (e.g. after refresh).
 * Does not retry when status is `failed` (avoids loops); login/register flows dispatch `fetchProfileAsync` explicitly.
 */
export function useAuthBootstrap() {
  const dispatch = useAppDispatch()
  const status = useAppSelector(selectProfileStatus)

  useEffect(() => {
    if (!session.getTokens().accessToken) return
    if (status !== 'idle') return
    void dispatch(fetchProfileAsync())
  }, [dispatch, status])
}
