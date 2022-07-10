import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DELIVERY_SERVICE } from "../config";
import { getTermsForService } from "./common";
import { addDays, subMinutes } from "date-fns";
import * as yup from "yup";
import { WDateUtils } from "@wcp/wcpshared";


export const deliveryAddressSchema = yup.object().shape({
  address: yup.string().ensure().required("Please enter your street address"),
  address2: yup.string().ensure().notRequired(),
  zipcode: yup.string().ensure().required()
    .matches(/^[0-9]+$/, "Please enter a 5 digit zipcode")
    .min(5, "Please enter a 5 digit zipcode")
    .max(5, "Please enter a 5 digit zipcode"),
  //deliveryInstructions: yup.string().ensure().notRequired()
});

export const dineInSchema = yup.object().shape({
  partySize: yup.number().integer().min(1).required("Please specify the size of your party.")
});

export const fulfillmentSchemaInstance = yup.object().shape({
  serviceNum: yup.string().ensure().required("Please select a service."), // TODO was working on maybe validating the delivery info or dine in schema as part of this since the errors aren't checked again when we've done things like select dine-in, select and then unselect the checkbox, then switch to pickup. the validation errors still exist
  serviceDate: yup.date().required("Please select a service date."),
  serviceTime: yup.number().integer().min(0).max(1439).required(),
  hasAgreedToTerms: yup.bool().when('serviceNum', (serviceNum, s) => {
    return serviceNum && getTermsForService(parseInt(serviceNum)).length > 0 ?
      s.test('hasAgreedToTerms', "Please accept the terms of service.", (v: boolean | undefined) => v === true) :
      s
  })
});

// export interface FulfillmentSchema extends yup.InferType<typeof fulfillmentSchemaInstance> { };
export interface DeliveryInfoRHFSchema {
  address: string;
  address2: string;
  zipcode: string;
  deliveryInstructions: string;
  validationStatus: 'UNVALIDATED' | 'VALID' | 'INVALID' | 'OUTSIDE_RANGE';
};

export interface DineInInfoRHFSchema {
  partySize: number;
};


export interface WFulfillmentState {
  hasSelectedTimeExpired: boolean;
  hasSelectedDateExpired: boolean;
  hasAgreedToTerms: boolean;
  selectedService: number | null;
  selectedDate: number | null;
  selectedTime: number | null;
  dineInInfo: DineInInfoRHFSchema | null;
  deliveryInfo: DeliveryInfoRHFSchema | null;
}

const initialState: WFulfillmentState = {
  hasSelectedTimeExpired: false,
  hasSelectedDateExpired: false,
  selectedService: null,
  selectedDate: null,
  selectedTime: null,
  dineInInfo: null,
  deliveryInfo: null,
  hasAgreedToTerms: false
}

const WFulfillmentSlice = createSlice({
  name: 'fulfillment',
  initialState: initialState,
  reducers: {
    setService(state, action: PayloadAction<number>) {
      if (state.selectedService !== action.payload) {
        state.hasSelectedDateExpired = false;
        state.hasAgreedToTerms = false;
        state.deliveryInfo = null;
        state.dineInInfo = null;
        state.selectedService = action.payload;
      }
    },
    setDate(state, action: PayloadAction<number | null>) {
      state.selectedDate = action.payload;
      state.hasSelectedDateExpired = state.hasSelectedDateExpired && action.payload === null;
    },
    setTime(state, action: PayloadAction<number | null>) {
      state.selectedTime = action.payload;
      state.hasSelectedTimeExpired = state.hasSelectedTimeExpired && action.payload === null;
    },
    setHasAgreedToTerms(state, action: PayloadAction<boolean>) {
      state.hasAgreedToTerms = action.payload;
    },
    setDineInInfo(state, action: PayloadAction<DineInInfoRHFSchema | null>) {
      state.dineInInfo = action.payload;
    },
    setDeliveryInfo(state, action: PayloadAction<DeliveryInfoRHFSchema | null>) {
      state.deliveryInfo = action.payload;
    },
  }
});

export const SelectServiceDateTime = createSelector(
  (s: WFulfillmentState) => s.selectedDate,
  (s: WFulfillmentState) => s.selectedTime,
  (selectedDate: number | null, selectedTime: number | null) => selectedDate !== null && selectedTime !== null ? subMinutes(addDays(selectedDate, 1), 1440 - selectedTime) : null
);

export const SelectServiceTimeDisplayString = createSelector(
  (s: WFulfillmentState) => s.selectedService,
  (s: WFulfillmentState) => s.selectedTime,
  (service: number | null, selectedTime: number | null) => service !== null && selectedTime !== null ?
    (service === DELIVERY_SERVICE ? `${WDateUtils.MinutesToPrintTime(selectedTime)} to later` : WDateUtils.MinutesToPrintTime(selectedTime)) : "");

export const { setService, setDate, setTime, setDineInInfo, setDeliveryInfo, setHasAgreedToTerms } = WFulfillmentSlice.actions;


export default WFulfillmentSlice.reducer;
