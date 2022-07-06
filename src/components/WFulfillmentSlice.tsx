import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DELIVERY_SERVICE, DINEIN_SERVICE } from "../config";
import { DeliveryAddress, getTermsForService, SERVICE_DATE_FORMAT } from "./common";
import { addMinutes, format } from "date-fns";
import * as yup from "yup";


const deliveryAddressSchema = yup.object().shape({
  address: yup.string().default("").required("Please enter your street address"),
  address2: yup.string().default("").notRequired(),
  zipcode: yup.string().default("").required()
    .matches(/^[0-9]+$/, "Please enter a 5 digit zipcode")
    .min(5, "Please enter a 5 digit zipcode")
    .max(5, "Please enter a 5 digit zipcode"),
  deliveryInstructions: yup.string().default("").notRequired()
});

const dineInSchema = yup.object().shape({
  partySize: yup.number().integer().min(1).required("Please specify the size of your party.")
});

export const fulfillmentSchemaInstance = yup.object().shape({
  serviceNum: yup.string().required("Please select a service."), // TODO was working on maybe validating the delivery info or dine in schema as part of this since the errors aren't checked again when we've done things like select dine-in, select and then unselect the checkbox, then switch to pickup. the validation errors still exist
  serviceDate: yup.date().required("Please select a service date."),
  serviceTime: yup.number().integer().min(0).max(1439).required(),
  hasAgreedToTerms: yup.bool().when('serviceNum', (serviceNum, s) => {
    return serviceNum !== null && getTermsForService(parseInt(serviceNum)).length > 0 ? 
    s.test('hasAgreedToTerms', "Please accept the terms of service.", (v: boolean | undefined) => v === true ) : 
    s}),
  deliveryInfo: deliveryAddressSchema.when('serviceNum', 
  (serviceNum, s) => {
    return serviceNum !== null && parseInt(serviceNum) === DELIVERY_SERVICE ? s.required('Please enter delivery information.') : s
  }),
  dineInInfo: dineInSchema.when('serviceNum', 
  (serviceNum, s) => {
    return serviceNum !== null && parseInt(serviceNum) === DINEIN_SERVICE ? s.required('Please enter dine-in information.') : s
  })
});

// export interface FulfillmentSchema extends yup.InferType<typeof fulfillmentSchemaInstance> { };

export interface FulfillmentSchema {
  serviceNum: string;
  serviceDate: Date | null;
  serviceTime: number | null;
  hasAgreedToTerms: boolean;
  deliveryInfo: { 
    address: string;
    address2: string;
    zipcode: string;
    deliveryInstructions: string;
  } | null;
  dineInInfo: {
    partySize: number | null;
  } | null;
}

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
    setFulfillment(state, action : PayloadAction<FulfillmentSchema>) {
      state.selectedService = parseInt(action.payload.serviceNum, 10);
      if (action.payload.dineInInfo) {
        state.partySize = action.payload.dineInInfo.partySize;
      }
      if (action.payload.deliveryInfo) {
        // state.deliveryAddress = ac
      }
      if (action.payload.serviceDate && action.payload.serviceTime) {
        state.dateTime = addMinutes(action.payload.serviceDate, action.payload.serviceTime).valueOf();
      }
    }
  }
});

export const SelectServiceTimeDisplayString = createSelector(
  (s: WFulfillmentState) => s.selectedService,
  (s: WFulfillmentState) => s.dateTime,
  (service: number | null, dateTime: number | null) => service !== null && dateTime !== null ? 
    (service === DELIVERY_SERVICE ? `${format(dateTime, SERVICE_DATE_FORMAT)} to later` : format(dateTime, SERVICE_DATE_FORMAT)) : "");

export const { setFulfillment} = WFulfillmentSlice.actions;


export default WFulfillmentSlice.reducer;
