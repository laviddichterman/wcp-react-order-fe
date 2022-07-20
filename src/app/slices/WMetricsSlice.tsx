import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TIMING_POLLING_INTERVAL } from "../../components/common";

export interface WMetricsState {
  pageLoadTime: number | null;
  // max of difference between current time and load time and the previous value of this and the time we think it's been since we last updated it
  roughTicksSinceLoad: number;
  // current time, or the last time we checked the validity of our availability
  currentTime: number | null;
  // time to first product added to cart
  timeToFirstProduct: number | null;
  // time of selecting a service date
  timeToServiceDate: number | null;
  // time of selecting a service time
  timeToServiceTime: number | null;
  // completion time for various stages
  timeToStage1: number | null;
  timeToStage2: number | null;
  timeToStage3: number | null;
  timeToStage4: number | null;
  timeToStage5: number | null;
}

const initialState: WMetricsState = {
  pageLoadTime: null,
  roughTicksSinceLoad: 0,
  currentTime: null,
  timeToFirstProduct: null,
  timeToServiceDate: null,
  timeToServiceTime: null,
  timeToStage1: null,
  timeToStage2: null,
  timeToStage3: null,
  timeToStage4: null,
  timeToStage5: null
}

const WMetricsSlice = createSlice({
  name: 'metrics',
  initialState: initialState,
  reducers: {
    setPageLoadTime(state, action: PayloadAction<number>) {
      if (state.pageLoadTime === null) {
        state.pageLoadTime = action.payload;
      }
    },
    setCurrentTime(state, action: PayloadAction<number>) {
      let ticks = state.roughTicksSinceLoad + TIMING_POLLING_INTERVAL;
      let time = action.payload;
      if (state.pageLoadTime !== null) {
        ticks = Math.max(ticks, action.payload - state.pageLoadTime);
        time = Math.max(time, state.pageLoadTime + ticks);
      }
      state.currentTime = time;
      state.roughTicksSinceLoad = ticks;
    },
  }
});



export const { setCurrentTime, setPageLoadTime } = WMetricsSlice.actions;


export default WMetricsSlice.reducer;
