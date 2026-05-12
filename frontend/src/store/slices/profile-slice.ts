import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { isAxiosError } from 'axios'
import {
  profileService,
  type ProfileUpdatePayload,
  type UpdatedProfile,
} from '@/services/profile-service'
import type { MeResponse, UserRole } from '@/services/types/auth'
import { logout } from '@/store/slices/auth-slice'

export type ProfileStatus = 'idle' | 'loading' | 'succeeded' | 'failed'

interface ProfileState {
  userId: string | null
  username: string | null
  email: string | null
  role: UserRole | null
  /** Backend does NOT return these on GET /auth/me. They are populated by
   *  PATCH /auth/profile responses during a session and reset to null on
   *  refresh until the user edits again. */
  bio: string | null
  avatarUrl: string | null
  region: string | null
  preferredLanguage: string | null
  status: ProfileStatus
  error: string | null
}

const initialState: ProfileState = {
  userId: null,
  username: null,
  email: null,
  role: null,
  bio: null,
  avatarUrl: null,
  region: null,
  preferredLanguage: null,
  status: 'idle',
  error: null,
}

export const fetchProfileAsync = createAsyncThunk<
  MeResponse,
  void,
  { rejectValue: string }
>('profile/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    return await profileService.getCurrentUser()
  } catch (err: unknown) {
    const message =
      isAxiosError(err) && err.response?.data
        ? (err.response.data as { error?: { message?: string } }).error?.message
        : err instanceof Error
          ? err.message
          : 'Could not load profile.'
    return rejectWithValue(message || 'Could not load profile.')
  }
})

export const updateProfileAsync = createAsyncThunk<
  UpdatedProfile,
  ProfileUpdatePayload,
  { rejectValue: { code?: string; message: string } }
>('profile/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    return await profileService.updateProfile(payload)
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.data) {
      const body = err.response.data as { error?: { code?: string; message?: string } }
      return rejectWithValue({
        code: body.error?.code,
        message: body.error?.message ?? 'Could not update profile.',
      })
    }
    const message = err instanceof Error ? err.message : 'Could not update profile.'
    return rejectWithValue({ message })
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
      /** Interceptor may dispatch `logout` first; avoid overwriting clean idle state with `failed`. */
      if (state.status !== 'loading') {
        return
      }
      state.status = 'failed'
      state.error =
        (action.payload as string | undefined) ?? 'Could not load profile.'
      state.userId = null
      state.username = null
      state.email = null
      state.role = null
    })
    builder.addCase(updateProfileAsync.fulfilled, (state, action) => {
      state.username = action.payload.username
      state.bio = action.payload.bio
      state.avatarUrl = action.payload.avatarUrl
      state.region = action.payload.region
      state.preferredLanguage = action.payload.preferredLanguage
    })
    builder.addCase(logout, () => initialState)
  },
})

export const selectProfile = (state: { profile: ProfileState }) => state.profile
export const selectProfileStatus = (state: { profile: ProfileState }) => state.profile.status
export const selectUserRole = (state: { profile: ProfileState }) => state.profile.role

export default profileSlice.reducer
