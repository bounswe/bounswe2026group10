import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { isAxiosError } from 'axios'
import { authService, type LoginRequest, type RegisterRequest } from '@/services/auth-service'
import { session } from '@/auth/session'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  loading: boolean
  /** True while `logoutAsync` is in flight (server call + local clear). Separate from `loading` (login/register). */
  isLoggingOut: boolean
  error: string | null
}

const tokens = session.getTokens()

const initialState: AuthState = {
  isAuthenticated: !!tokens.accessToken,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  userId: tokens.userId,
  loading: false,
  isLoggingOut: false,
  error: null,
}

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (payload: LoginRequest, { rejectWithValue }) => {
    try {
      const data = await authService.login(payload)
      session.setTokens(data)
      return data
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message
        : undefined
      return rejectWithValue(message || 'Invalid email or password.')
    }
  }
)

export const registerAsync = createAsyncThunk(
  'auth/register',
  async (payload: RegisterRequest, { rejectWithValue }) => {
    try {
      const data = await authService.register(payload)
      session.setTokens(data)
      return data
    } catch (err: unknown) {
      const message = isAxiosError(err)
        ? (err.response?.data as { error?: { message?: string } } | undefined)?.error?.message
        : undefined
      return rejectWithValue(message || 'Registration failed. Please try again.')
    }
  }
)

/**
 * Server logout + clear Redux and `session` storage.
 * If `session` has an access token, calls `POST /auth/logout` (same source as the HTTP Bearer interceptor).
 * Network errors are ignored; local session is always cleared.
 * Does not reject — `unwrap()` always resolves after local cleanup.
 */
export const logoutAsync = createAsyncThunk(
  'auth/logoutAsync',
  async (_, { dispatch }) => {
    const accessToken = session.getTokens().accessToken
    if (accessToken) {
      try {
        await authService.logout()
      } catch {
        /* still clear local session if network fails */
      }
    }
    dispatch({ type: 'auth/logout' })
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.isAuthenticated = false
      state.accessToken = null
      state.refreshToken = null
      state.userId = null
      state.error = null
      state.isLoggingOut = false
      session.clearTokens()
    },
    clearError(state) {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    // Login
    builder.addCase(loginAsync.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(loginAsync.fulfilled, (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.userId = action.payload.userId
    })
    builder.addCase(loginAsync.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string
    })

    // Register
    builder.addCase(registerAsync.pending, (state) => {
      state.loading = true
      state.error = null
    })
    builder.addCase(registerAsync.fulfilled, (state, action) => {
      state.loading = false
      state.isAuthenticated = true
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.userId = action.payload.userId
    })
    builder.addCase(registerAsync.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string
    })

    builder.addCase(logoutAsync.pending, (state) => {
      state.isLoggingOut = true
    })
    builder.addCase(logoutAsync.fulfilled, (state) => {
      state.isLoggingOut = false
    })
    builder.addCase(logoutAsync.rejected, (state) => {
      state.isLoggingOut = false
    })
  },
})

export const { logout, clearError } = authSlice.actions

export default authSlice.reducer
