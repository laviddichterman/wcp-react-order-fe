import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IMoney } from "@wcp/wcpshared";

export interface TipSelection { 
  value: number;
  isSuggestion: boolean;
  isPercentage: boolean;
};

// export class TipSelection {
//   isSuggestion: boolean;
//   isPercentage: boolean;
//   value: number;
//   constructor(isSuggestion: boolean, isPercentage: boolean, value: number) {
//     this.isSuggestion = isSuggestion;
//     this.isPercentage = isPercentage;
//     this.value = value;
//   }
//   computeCashValue(basis: number) {
//     return this.isPercentage ? basis * this.value : this.value;
//   }
// };


export interface WPaymentState {
  storeCreditValidation: {
    type: 'MONEY' | 'DISCOUNT';
    lock: { enc: string, iv: string, auth: string }
    amount: IMoney,
    code: string
  } | null;
  storeCreditRedemption: {

  } | null;
  squarePayment: {

  } | null;
  selectedTip: TipSelection | null;
}

const initialState: WPaymentState = {
  storeCreditValidation: null,
  storeCreditRedemption: null,
  squarePayment: null,
  selectedTip: null
}

const WPaymentSlice = createSlice({
  name: 'payment',
  initialState: initialState,
  reducers: {
    setService(state, action: PayloadAction<number>) {
      
    }
  }
});

export const { setService } = WPaymentSlice.actions;


export default WPaymentSlice.reducer;
