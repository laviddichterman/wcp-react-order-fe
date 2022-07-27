import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type * as Square from '@square/web-sdk';
import { CreateOrderRequestV2, TipSelection, CreateOrderResponse, RoundToTwoDecimalPlaces, ValidateAndLockCreditResponse } from "@wcp/wcpshared";
import axiosInstance from "../../utils/axios";

export const validateStoreCredit = createAsyncThunk<ValidateAndLockCreditResponse, string>(
  'credit/validate',
  async (code) => {
    const response = await axiosInstance.get('/api/v1/payments/storecredit/validate', {
      params: { code },
    });
    return response.data;
  }
);

export const submitToWario = createAsyncThunk<CreateOrderResponse, CreateOrderRequestV2>(
  'order',
  async (req) => {
    const response = await axiosInstance.post('/api/v1/order', req);
    return response.data;
  }
);

export interface WPaymentState {
  storeCreditValidation: ValidateAndLockCreditResponse | null;
  warioResponse: {

  } | null;
  selectedTip: TipSelection | null;
  storeCreditInput: string;
  squareTokenErrors: Square.TokenError[];
  creditValidationLoading: 'IDLE' | 'PENDING' | 'SUCCEEDED' | 'FAILED';
  submitToWarioStatus: 'IDLE' | 'PENDING' | 'SUCCEEDED' | 'FAILED';
}

const initialState: WPaymentState = {
  storeCreditValidation: null,
  warioResponse: null,
  squareTokenErrors: [],
  selectedTip: null,
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
      action.payload.result
      state.submitToWarioStatus = 'SUCCEEDED';
    })
    .addCase(submitToWario.pending, (state) => {
      state.warioResponse = null;
      state.submitToWarioStatus = 'PENDING';
    })
    .addCase(submitToWario.rejected, (state) => {
      state.submitToWarioStatus = 'FAILED';
    })
  },
});

export const { setTip, clearCreditCode, setSquareTokenizationErrors } = WPaymentSlice.actions;

export default WPaymentSlice.reducer;
