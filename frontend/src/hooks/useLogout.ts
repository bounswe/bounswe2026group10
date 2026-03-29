import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutAsync } from '@/store/slices/auth-slice'

export function useLogout() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const isLoggingOut = useAppSelector((s) => s.auth.isLoggingOut)

  const logout = useCallback(async () => {
    await dispatch(logoutAsync()).unwrap()
    navigate('/', { replace: true })
  }, [dispatch, navigate])

  return { logout, isLoggingOut }
}
