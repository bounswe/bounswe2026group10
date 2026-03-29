import { configureStore } from '@reduxjs/toolkit'
import authReducer from '@/store/slices/auth-slice'
import profileReducer from '@/store/slices/profile-slice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
