import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authService, type LoginRequest, type RegisterRequest } from '@/services/auth-service'
import { session } from '@/auth/session'

interface AuthState {
  isAuthenticated: boolean
  accessToken: string | null
  refreshToken: string | null
  userId: string | null
  loading: boolean
  error: string | null
}

const tokens = session.getTokens()

const initialState: AuthState = {
  isAuthenticated: !!tokens.accessToken,
  accessToken: tokens.accessToken,
  refreshToken: tokens.refreshToken,
  userId: tokens.userId,
  loading: false,
  error: null,
}

export const loginAsync = createAsyncThunk(
  'auth/login',
  async (payload: LoginRequest, { rejectWithValue }) => {
    try {
      const data = await authService.login(payload)
      session.setTokens(data)
      return data
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error?.message || 'Invalid email or password.'
      )
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
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error?.message || 'Registration failed. Please try again.'
      )
    }
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
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
