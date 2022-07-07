import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DELIVERY_SERVICE, DINEIN_SERVICE } from "../config";
import { getTermsForService, SERVICE_DATE_FORMAT } from "./common";
import { addMinutes, format } from "date-fns";
import * as yup from "yup";


export const deliveryAddressSchema = yup.object().shape({
  address: yup.string().ensure().required("Please enter your street address"),
  address2: yup.string().ensure().notRequired(),
  zipcode: yup.string().ensure().required()
    .matches(/^[0-9]+$/, "Please enter a 5 digit zipcode")
    .min(5, "Please enter a 5 digit zipcode")
    .max(5, "Please enter a 5 digit zipcode"),
  deliveryInstructions: yup.string().ensure().notRequired()
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
  }),
  // deliveryInfo: deliveryAddressSchema.when('serviceNum', 
  // (serviceNum, s) => {
  //   return serviceNum !== null && parseInt(serviceNum) === DELIVERY_SERVICE ? s.required('Please enter delivery information.') : s
  // }),
  // dineInInfo: dineInSchema.when('serviceNum', 
  // (serviceNum, s) => {
  //   return serviceNum !== null && parseInt(serviceNum) === DINEIN_SERVICE ? s.required('Please enter dine-in information.') : s
  // })
});

// export interface FulfillmentSchema extends yup.InferType<typeof fulfillmentSchemaInstance> { };
export interface AggreedToTermsSchema {
  hasAgreedToTerms: boolean;
};

export interface DeliveryInfoSchema {
  deliveryInfo: {
    address: string;
    address2: string;
    zipcode: string;
    deliveryInstructions: string;
    isDeliveryAddressValidated: boolean;
  } | null;
};

export interface DineInInfoRHFSchema {
  partySize: number;
};

export interface DineInInfoSchema {
  dineInInfo: DineInInfoRHFSchema | null;
};

export interface BaseFulfillmentInfoSchema {
  serviceNum: string;
  serviceDate: number | null;
  serviceTime: number | null;
};

export type FulfillmentSchema = BaseFulfillmentInfoSchema & AggreedToTermsSchema & DineInInfoSchema & DeliveryInfoSchema;

interface ReduxFulfillmentStateBase {
  hasSelectedTimeExpired: boolean;
  hasSelectedDateExpired: boolean;
  selectedService: number | null;
  dateTime: number | null;
} 

export type WFulfillmentState = ReduxFulfillmentStateBase & DineInInfoSchema & DeliveryInfoSchema & AggreedToTermsSchema

const initialState: WFulfillmentState = {
  hasSelectedTimeExpired: false,
  hasSelectedDateExpired: false,
  selectedService: null,
  dateTime: null,
  dineInInfo: null,
  deliveryInfo: null,
  hasAgreedToTerms: false
}

const WFulfillmentSlice = createSlice({
  name: 'fulfillment',
  initialState: initialState,
  reducers: {
    setFulfillment(state, action: PayloadAction<FulfillmentSchema>) {
      state = { 
        hasSelectedDateExpired: action.payload.serviceDate !== null, // TODO this hasn't been thought out
        hasSelectedTimeExpired: action.payload.serviceTime !== null,// TODO this hasn't been thought out
        selectedService: parseInt(action.payload.serviceNum, 10),
        dateTime: action.payload.serviceDate && action.payload.serviceTime ? addMinutes(action.payload.serviceDate, action.payload.serviceTime).valueOf() : state.dateTime,
        ...action.payload
      };
    }
  }
});

export const SelectServiceTimeDisplayString = createSelector(
  (s: WFulfillmentState) => s.selectedService,
  (s: WFulfillmentState) => s.dateTime,
  (service: number | null, dateTime: number | null) => service !== null && dateTime !== null ?
    (service === DELIVERY_SERVICE ? `${format(dateTime, SERVICE_DATE_FORMAT)} to later` : format(dateTime, SERVICE_DATE_FORMAT)) : "");

export const { setFulfillment } = WFulfillmentSlice.actions;


export default WFulfillmentSlice.reducer;
