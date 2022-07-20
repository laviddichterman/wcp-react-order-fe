import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
// import { IMoney } from "@wcp/wcpshared";
import axiosInstance from "../../utils/axios";
import { RoundToTwoDecimalPlaces } from "../../utils/numbers";

export interface TipSelection { 
  value: number;
  isSuggestion: boolean;
  isPercentage: boolean;
};

export const ComputeTipValue = (tip : TipSelection, basis : number) =>
 (tip.isPercentage ? RoundToTwoDecimalPlaces(tip.value * basis) : tip.value);

 export interface ValidateResponse {
  enc: string;
  iv: string;
  auth: string;
  validated: boolean;
  amount: number;
  credit_type: "MONEY" | "DISCOUNT"
 }

 export const validateStoreCredit = createAsyncThunk<ValidateResponse, string>(
  'credit/validate',
  async (code) => {
    const response = await axiosInstance.get('/api/v1/payments/storecredit/validate', {
      params: { code },
    });
    return response.data;
  }
);

export interface WPaymentState {
  storeCreditValidation: ValidateResponse | null;
  storeCreditRedemption: {

  } | null;
  squarePayment: {

  } | null;
  selectedTip: TipSelection | null;
  storeCreditInput: string;
  creditValidationLoading: 'IDLE' | 'PENDING' | 'SUCCEEDED' | 'FAILED';
}

const initialState: WPaymentState = {
  storeCreditValidation: null,
  storeCreditRedemption: null,
  squarePayment: null,
  selectedTip: null,
  storeCreditInput: "",
  creditValidationLoading: 'IDLE'
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
    }
  },
  extraReducers: (builder) => {
    // Add reducers for additional action types here, and handle loading state as needed
    builder
    .addCase(validateStoreCredit.fulfilled, (state, action) => {
      state.storeCreditValidation = action.payload;
      state.creditValidationLoading = 'SUCCEEDED';
    })
    .addCase(validateStoreCredit.pending, (state, action) => {
      state.storeCreditValidation = null;
      state.storeCreditInput = action.meta.arg;
      state.creditValidationLoading = 'PENDING';
    })
    .addCase(validateStoreCredit.rejected, (state) => {
      state.creditValidationLoading = 'FAILED';
    })
  },
});

export const { setTip, clearCreditCode } = WPaymentSlice.actions;


export default WPaymentSlice.reducer;
