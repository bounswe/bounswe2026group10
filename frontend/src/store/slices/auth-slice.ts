import { createSlice } from '@reduxjs/toolkit'

const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: false as boolean },
  reducers: {},
})

export default authSlice.reducer
