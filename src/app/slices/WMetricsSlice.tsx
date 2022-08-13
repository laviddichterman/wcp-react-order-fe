import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MetricsDto } from "@wcp/wcpshared";
import { NUM_STAGES, STEPPER_STAGE_ENUM, TIMING_POLLING_INTERVAL} from "../../config";
import PACKAGE_INFO from '../../../package.json'
import type { CurrentTimes } from "./ListeningMiddleware";

const initialState: MetricsDto = {
  pageLoadTime: 0,
  pageLoadTimeLocal: 0,
  submitTime: 0,
  roughTicksSinceLoad: 0,
  currentTime: 0,
  currentLocalTime: 0,
  useragent: "",
  timeToServiceDate: 0,
  timeToServiceTime: 0,
  // handled by the ListenerMiddleware
  timeToFirstProduct: 0,
  timeToStage: Array(NUM_STAGES-1).fill(0),
  numTimeBumps: 0,
  numTipAdjusts: 0,
  numTipFixed: 0
}

const WMetricsSlice = createSlice({
  name: 'metrics',
  initialState: initialState,
  reducers: {
    setPageLoadTime(state, action: PayloadAction<number>) {
      state.pageLoadTime = action.payload;
      state.currentTime = action.payload;
    },
    setPageLoadTimeLocal(state, action: PayloadAction<number>) {
      state.pageLoadTimeLocal = action.payload;
      state.currentLocalTime = action.payload;
    },
    // handled by ListeningMiddleware
    setCurrentTimes(state, action: PayloadAction<CurrentTimes>) {
      const ticks = Math.max(state.roughTicksSinceLoad + TIMING_POLLING_INTERVAL, action.payload.currentLocalTime - state.pageLoadTimeLocal);
      state.currentLocalTime = Math.max(action.payload.currentLocalTime, state.pageLoadTimeLocal + ticks);
      state.currentTime = action.payload.loadTime + ticks;
      state.roughTicksSinceLoad = ticks;
    },
    // handled by ListenerMiddleware
    incrementTimeBumps(state) {
      state.numTimeBumps = state.numTimeBumps + 1;
    },
    incrementTipAdjusts(state) {
      state.numTipAdjusts = state.numTipAdjusts + 1;
    },
    incrementTipFixes(state) {
      state.numTipFixed = state.numTipFixed + 1;
    },
    // handled by ListenerMiddleware
    setTimeToStage(state, action: PayloadAction<{ stage: STEPPER_STAGE_ENUM, ticks: number }>) {
      state.timeToStage![action.payload.stage] = action.payload.ticks - state.pageLoadTimeLocal;
    },
    setTimeToServiceDate(state, action: PayloadAction<number>) {
      state.timeToServiceDate = action.payload - state.pageLoadTimeLocal;
    },
    setTimeToServiceTime(state, action: PayloadAction<number>) {
      state.timeToServiceTime = action.payload - state.pageLoadTimeLocal;
    },
    setSubmitTime(state, action: PayloadAction<number>) {
      state.submitTime = action.payload - state.pageLoadTimeLocal;
    },
    // handled by App.tsx
    setUserAgent(state, action: PayloadAction<string>) {
      state.useragent = `${action.payload} FEV: ${PACKAGE_INFO.version}`;
    }
  }
});

export const { 
  setCurrentTimes, 
  setPageLoadTime, 
  setUserAgent, 
  setPageLoadTimeLocal, 
  setTimeToStage, 
  incrementTimeBumps, 
  incrementTipAdjusts, 
  incrementTipFixes, 
  setTimeToServiceDate, 
  setTimeToServiceTime, 
  setSubmitTime } = WMetricsSlice.actions;


export default WMetricsSlice.reducer;
