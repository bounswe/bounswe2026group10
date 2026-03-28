/**
 * Single place for token storage (localStorage is used for MVP; move to httpOnly cookie if strict security dictates).
 * Components should not read localStorage directly; use these helpers.
 */

const ACCESS_KEY = 'rr_access_token'
const REFRESH_KEY = 'rr_refresh_token'
const USER_KEY = 'rr_user_id'

export const session = {
  getTokens() {
    return {
      accessToken: localStorage.getItem(ACCESS_KEY),
      refreshToken: localStorage.getItem(REFRESH_KEY),
      userId: localStorage.getItem(USER_KEY),
    }
  },

  setTokens({ accessToken, refreshToken, userId }: { accessToken: string; refreshToken: string; userId: string }) {
    localStorage.setItem(ACCESS_KEY, accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
    localStorage.setItem(USER_KEY, userId)
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
  },
}
