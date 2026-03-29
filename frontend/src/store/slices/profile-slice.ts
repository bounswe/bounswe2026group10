import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { isAxiosError } from 'axios'
import { profileService } from '@/services/profile-service'
import type { MeResponse, UserRole } from '@/services/types/auth'
import { logout } from '@/store/slices/auth-slice'

export type ProfileStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

interface ProfileState {
  userId: string | null
  username: string | null
  email: string | null
  role: UserRole | null
  status: ProfileStatus
  error: string | null
}

const initialState: ProfileState = {
  userId: null,
  username: null,
  email: null,
  role: null,
  status: 'idle',
  error: null,
}

const SESSION_EXPIRED = '__SESSION_EXPIRED__'

export const fetchProfileAsync = createAsyncThunk<
  MeResponse,
  void,
  { rejectValue: string }
>('profile/fetchProfile', async (_, { dispatch, rejectWithValue }) => {
  try {
    return await profileService.getCurrentUser()
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 401) {
      dispatch(logout())
      return rejectWithValue(SESSION_EXPIRED)
    }
    const message =
      isAxiosError(err) && err.response?.data
        ? (err.response.data as { error?: { message?: string } }).error?.message
        : err instanceof Error
          ? err.message
          : 'Could not load profile.'
    return rejectWithValue(message || 'Could not load profile.')
  }
})

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchProfileAsync.pending, (state) => {
      state.status = 'loading'
      state.error = null
    })
    builder.addCase(fetchProfileAsync.fulfilled, (state, action) => {
      state.status = 'succeeded'
      state.userId = action.payload.userId
      state.username = action.payload.username
      state.email = action.payload.email
      state.role = action.payload.role
      state.error = null
    })
    builder.addCase(fetchProfileAsync.rejected, (state, action) => {
      if (action.payload === SESSION_EXPIRED) {
        return initialState
      }
      state.status = 'failed'
      state.error = (action.payload as string) ?? 'Could not load profile.'
      state.userId = null
      state.username = null
      state.email = null
      state.role = null
    })
    builder.addCase(logout, () => initialState)
  },
})

export const selectProfile = (state: { profile: ProfileState }) => state.profile
export const selectProfileStatus = (state: { profile: ProfileState }) => state.profile.status
export const selectUserRole = (state: { profile: ProfileState }) => state.profile.role

export default profileSlice.reducer
