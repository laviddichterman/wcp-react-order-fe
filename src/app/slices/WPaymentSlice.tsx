import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type * as Square from '@square/web-sdk';
import { CreateValidateStoreCreditThunk, scrollToIdOffsetAfterDelay } from "@wcp/wario-ux-shared";
import { TipSelection, CrudOrderResponse, ValidateAndLockCreditResponseValid } from "@wcp/wcpshared";
import axiosInstance from "../../utils/axios";
import { AppDispatch, RootState, SelectWarioSubmissionArguments } from "../store";
import { setSubmitTime } from "./WMetricsSlice";

export const validateStoreCredit = CreateValidateStoreCreditThunk(axiosInstance);

export const submitToWario = createAsyncThunk<CrudOrderResponse, string|null, {dispatch: AppDispatch; state: RootState}>(
  'order',
  async (nonce, thunkApi) => {
    thunkApi.dispatch(setSubmitTime(Date.now()));
    const request = SelectWarioSubmissionArguments(thunkApi.getState(), nonce);
    try {
      const result = await axiosInstance.post('/api/v1/order', request);
      return result.data;
    }
    catch (err : any) { 
      console.log(err);
      try {
        thunkApi.dispatch(setOrderSubmitErrors(err!.error.map(((x : any) => x.detail))));
      } catch (e) { }
      return thunkApi.rejectWithValue(err);
    }
  }
);

export interface WPaymentState {
  storeCreditValidations: { code: string; validation: ValidateAndLockCreditResponseValid; createdAt: number; }[];
  warioResponse: CrudOrderResponse | null;
  selectedTip: TipSelection | null;
  acknowledgeInstructionsDialogue: boolean;
  specialInstructions: string | null;
  storeCreditInput: string;
  squareTokenErrors: Square.TokenError[];
  orderSubmitErrors: string[];
  creditValidationLoading: 'IDLE' | 'PENDING' | 'SUCCEEDED' | 'FAILED';
  submitToWarioStatus: 'IDLE' | 'PENDING' | 'SUCCEEDED' | 'FAILED';
}

const initialState: WPaymentState = {
  storeCreditValidations: [],
  warioResponse: null,
  squareTokenErrors: [],
  orderSubmitErrors: [],
  selectedTip: null,
  acknowledgeInstructionsDialogue: false,
  specialInstructions: null,
  storeCreditInput: "",
  creditValidationLoading: 'IDLE',
  submitToWarioStatus: 'IDLE'
}

const WPaymentSlice = createSlice({
  name: 'payment',
  initialState: initialState,
  reducers: {
    setTip(state, action: PayloadAction<TipSelection>) {
      state.selectedTip = action.payload;
    },
    clearCreditCode(state) {
      state.creditValidationLoading = 'IDLE';
      state.storeCreditInput = "";
      state.storeCreditValidations = [];
    },
    setSquareTokenizationErrors(state, action: PayloadAction<Square.TokenError[]>) {
      state.squareTokenErrors = action.payload;
    },
    setOrderSubmitErrors(state, action: PayloadAction<string[]>) {
      state.orderSubmitErrors = action.payload;
    },
    setSpecialInstructions(state, action: PayloadAction<string>) {
      state.specialInstructions = action.payload;
    },
    setAcknowledgeInstructionsDialogue(state, action: PayloadAction<boolean>) {
      state.specialInstructions = null;
      state.acknowledgeInstructionsDialogue = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
    .addCase(validateStoreCredit.fulfilled, (state, action) => {
      if (action.payload.valid) {
        state.storeCreditValidations = [...state.storeCreditValidations, { validation: action.payload, code: action.meta.arg, createdAt: Date.now() } ];
        state.creditValidationLoading = 'SUCCEEDED';
      } else {
        state.creditValidationLoading = 'FAILED';
      }
    })
    .addCase(validateStoreCredit.pending, (state, action) => {
      state.storeCreditInput = action.meta.arg;
      state.creditValidationLoading = 'PENDING';
    })
    .addCase(validateStoreCredit.rejected, (state) => {
      state.creditValidationLoading = 'FAILED';
    })
    .addCase(submitToWario.fulfilled, (state, action) => {
      state.warioResponse = action.payload;
      scrollToIdOffsetAfterDelay("WARIO_order", 500);
      state.submitToWarioStatus = 'SUCCEEDED';
    })
    .addCase(submitToWario.pending, (state) => {
      state.warioResponse = null;
      state.orderSubmitErrors = [];
      state.squareTokenErrors = [];
      state.submitToWarioStatus = 'PENDING';
    })
    .addCase(submitToWario.rejected, (state, action) => {
      console.log(action);
      // errors are already populated by the thunk
      //state.orderSubmitErrors = [action.error.message as string];
      state.submitToWarioStatus = 'FAILED';
    })
  },
});

export const { setTip, clearCreditCode, setSquareTokenizationErrors, setOrderSubmitErrors, setSpecialInstructions, setAcknowledgeInstructionsDialogue } = WPaymentSlice.actions;

export const WPaymentReducer = WPaymentSlice.reducer;
