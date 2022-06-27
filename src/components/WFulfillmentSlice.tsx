import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DeliveryAddress } from "./common";

export interface WFulfillmentState {
  selectedService: number | null;
  dateTime: number | null;
  partySize: number | null;
  deliveryAddress: DeliveryAddress | null;
  isDeliveryAddressValidated: boolean;

}

const initialState: WFulfillmentState = {
  selectedService: null,
  dateTime: null,
  partySize: null,
  deliveryAddress: null,
  isDeliveryAddressValidated: false,
}

const WFulfillmentSlice = createSlice({
  name: 'fulfillment',
  initialState: initialState,
  reducers: {
  }
});



// export const { } = WFulfillmentSlice.actions;


export default WFulfillmentSlice.reducer;
