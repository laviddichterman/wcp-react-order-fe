import { createSlice, PayloadAction, createEntityAdapter, EntityState } from "@reduxjs/toolkit";
import { CartEntry } from "../../components/common";


const WCartAdapter = createEntityAdapter<CartEntry>({
  selectId: entry => entry.id
});

export interface StepperState {
  stage: number;
}

const initialState: StepperState = {
  stage: 0
}

const StepperSlice = createSlice({
  name: 'stepper',
  initialState: initialState,
  reducers: {
    setStage(state, action: PayloadAction<number>) {
      state.stage = action.payload;
    }
  }
});

export const { setStage } = StepperSlice.actions;

export default StepperSlice.reducer;
