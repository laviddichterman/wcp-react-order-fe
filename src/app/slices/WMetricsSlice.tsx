import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MetricsDto } from "@wcp/wcpshared";
import { NUM_STAGES, STEPPER_STAGE_ENUM, TIMING_POLLING_INTERVAL} from "../../config";

const initialState: MetricsDto = {
  pageLoadTime: 0,
  pageLoadTimeLocal: 0,
  submitTime: 0,
  roughTicksSinceLoad: 0,
  currentTime: 0,
  useragent: "",
  timeToServiceDate: 0,
  timeToServiceTime: 0,
  // handled by the ListenerMiddleware
  timeToFirstProduct: 0,
  timeToStage: Array(NUM_STAGES).fill(0),
  numTimeBumps: 0,
}

const WMetricsSlice = createSlice({
  name: 'metrics',
  initialState: initialState,
  reducers: {
    setPageLoadTime(state, action: PayloadAction<number>) {
      state.pageLoadTime = action.payload;
    },
    setPageLoadTimeLocal(state, action: PayloadAction<number>) {
      state.pageLoadTimeLocal = action.payload;
    },
    // handled by ListeningMiddleware
    setCurrentTime(state, action: PayloadAction<number>) {
      const ticks = Math.max(state.roughTicksSinceLoad + TIMING_POLLING_INTERVAL, action.payload - state.pageLoadTime);
      const time = Math.max(action.payload, state.pageLoadTime + ticks);
      state.currentTime = time;
      state.roughTicksSinceLoad = ticks;
    },
    // handled by ListenerMiddleware
    incrementTimeBumps(state) {
      state.numTimeBumps = state.numTimeBumps + 1;
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
      state.useragent = action.payload;
    }
  }
});



export const { setCurrentTime, setPageLoadTime, setUserAgent, setPageLoadTimeLocal, setTimeToStage, incrementTimeBumps, setTimeToServiceDate, setTimeToServiceTime, setSubmitTime } = WMetricsSlice.actions;


export default WMetricsSlice.reducer;
