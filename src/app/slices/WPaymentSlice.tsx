import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type * as Square from '@square/web-sdk';
import { TipSelection, CreateOrderResponse, ValidateAndLockCreditResponse } from "@wcp/wcpshared";
import axiosInstance from "../../utils/axios";
import { AppDispatch, RootState, SelectWarioSubmissionArguments } from "../store";
import { setSubmitTime } from "./WMetricsSlice";

export const validateStoreCredit = createAsyncThunk<ValidateAndLockCreditResponse, string>(
  'credit/validate',
  async (code) => {
    const response = await axiosInstance.get('/api/v1/payments/storecredit/validate', {
      params: { code },
    });
    return response.data;
  }
);

export const submitToWario = createAsyncThunk<CreateOrderResponse, void, {dispatch: AppDispatch; state: RootState}>(
  'order',
  async (_, thunkApi) => {
    thunkApi.dispatch(setSubmitTime(Date.now()));
    const request = SelectWarioSubmissionArguments(thunkApi.getState());
    try {
      const result = await axiosInstance.post('/api/v1/order', request);
      return result.data;
    }
    catch (err : any) { 
      console.log(err);
      try {
        thunkApi.dispatch(setOrderSubmitErrors(err!.result.errors.map(((x : any) => x.detail))));
      } catch (e) { }
      return thunkApi.rejectWithValue(err);
    }
  }
);

export interface WPaymentState {
  storeCreditValidation: ValidateAndLockCreditResponse | null;
  warioResponse: CreateOrderResponse | null;
  selectedTip: TipSelection | null;
  specialInstructions: string | null;
  storeCreditInput: string;
  squareTokenErrors: Square.TokenError[];
  orderSubmitErrors: string[];
  squareNonce?: string;
  creditValidationLoading: 'IDLE' | 'PENDING' | 'SUCCEEDED' | 'FAILED';
  submitToWarioStatus: 'IDLE' | 'PENDING' | 'SUCCEEDED' | 'FAILED';
}

const initialState: WPaymentState = {
  storeCreditValidation: null,
  warioResponse: null,
  squareTokenErrors: [],
  orderSubmitErrors: [],
  selectedTip: null,
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
      state.storeCreditValidation = null;
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
    setSquareNonce(state, action: PayloadAction<string>) { 
      state.squareNonce = action.payload;
    }
  },
  extraReducers: (builder) => {
    // Add reducers for additional action types here, and handle loading state as needed
    builder
    .addCase(validateStoreCredit.fulfilled, (state, action) => {
      state.storeCreditValidation = action.payload;
      state.creditValidationLoading = action.payload.valid ? 'SUCCEEDED' : 'FAILED';
    })
    .addCase(validateStoreCredit.pending, (state, action) => {
      state.storeCreditValidation = null;
      state.storeCreditInput = action.meta.arg;
      state.creditValidationLoading = 'PENDING';
    })
    .addCase(validateStoreCredit.rejected, (state) => {
      state.creditValidationLoading = 'FAILED';
    })
    .addCase(submitToWario.fulfilled, (state, action) => {
      state.warioResponse = action.payload;
      state.submitToWarioStatus = 'SUCCEEDED';
    })
    .addCase(submitToWario.pending, (state) => {
      state.warioResponse = null;
      state.squareNonce = undefined;
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

export const { setTip, clearCreditCode, setSquareTokenizationErrors, setOrderSubmitErrors, setSpecialInstructions, setSquareNonce } = WPaymentSlice.actions;

export const WPaymentReducer = WPaymentSlice.reducer;
