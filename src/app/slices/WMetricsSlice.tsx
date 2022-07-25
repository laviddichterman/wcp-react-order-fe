import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MetricsDto, NullablePartial } from "@wcp/wcpshared";
import { TIMING_POLLING_INTERVAL } from "../../components/common";

const initialState: NullablePartial<MetricsDto> = {
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
  timeToStage5: null,
  useragent: null
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
      let ticks = state.roughTicksSinceLoad! + TIMING_POLLING_INTERVAL;
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
