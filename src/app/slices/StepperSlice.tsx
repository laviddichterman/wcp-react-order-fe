import { createSlice, PayloadAction, createEntityAdapter, EntityState } from "@reduxjs/toolkit";

// const Loadable = (Component : ElementType) => (props : any) => {
//   // eslint-disable-next-line react-hooks/rules-of-hooks
//   const { pathname } = useLocation();

//   return (
//     <Suspense fallback={<LoadingScreen isDashboard={pathname.includes('/dashboard')} />}>
//       <Component {...props} />
//     </Suspense>
//   );
// };

export enum STEPPER_STAGE_ENUM {
  TIMING,
  ADD_PRODUCTS,
  CUSTOMER_INFO,
  REVIEW_ORDER,
  CHECK_OUT,
  CONFIRMATION
};


export interface StepperState {
  stage: STEPPER_STAGE_ENUM;
}

const initialState: StepperState = {
  stage: STEPPER_STAGE_ENUM.TIMING
}

const StepperSlice = createSlice({
  name: 'stepper',
  initialState: initialState,
  reducers: {
    setStage(state, action: PayloadAction<STEPPER_STAGE_ENUM>) {
      state.stage = action.payload;
    },
    nextStage(state) {
      state.stage = state.stage+1;
    },
    backStage(state) {
      state.stage = state.stage-1;
    }
  }
});

export const { setStage, nextStage, backStage } = StepperSlice.actions;

export default StepperSlice.reducer;