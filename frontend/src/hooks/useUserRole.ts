import { useAppSelector } from '@/store/hooks'
import { selectUserRole } from '@/store/slices/profile-slice'
import type { UserRole } from '@/services/types/auth'

/** Reads the authenticated user's role from Redux. Returns null while loading or unauthenticated. */
export function useUserRole(): UserRole | null {
  return useAppSelector(selectUserRole)
}
