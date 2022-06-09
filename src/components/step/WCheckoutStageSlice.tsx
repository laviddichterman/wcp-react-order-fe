import { createSlice } from '@reduxjs/toolkit'

const initialState = []

const WCheckoutStageSlice = createSlice({
  name: 'WCheckoutStageSlice',
  initialState,
  reducers: {
    todoAdded(state, action) {
      // ✅ This "mutating" code is okay inside of createSlice!
      state.push(action.payload)
    },
    todoToggled(state, action) {
      const todo = state.find(todo => todo.id === action.payload)
      todo.completed = !todo.completed
    },
    todosLoading(state, action) {
      return {
        ...state,
        status: 'loading'
      }
    }
  }
})

export const { todoAdded, todoToggled, todosLoading } = WCheckoutStageSlice.actions

export default WCheckoutStageSlice.reducer