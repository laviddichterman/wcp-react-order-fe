import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DELIVERY_SERVICE, DINEIN_SERVICE } from "../config";
import { DeliveryAddress, getTermsForService } from "./common";
import { addMinutes } from "date-fns";
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
  serviceEnum: yup.number().default(null).integer().required("Please select a service."),
  serviceDate: yup.date().default(null).required("Please select a service date.").nullable().default(undefined),
  serviceTime: yup.number().default(null).integer().min(0).max(1439).required(),
  hasAgreedToTerms: yup.bool().default(null).required().when('serviceEnum', (serviceEnum, s) => {
     return serviceEnum !== null && Number.isInteger(serviceEnum) && getTermsForService(serviceEnum).length > 0 ? 
    s.test('serviceEnum', "Please accept the terms of service.", (v: boolean | undefined) => v === true) : 
    s}),
  deliveryInfo: deliveryAddressSchema.when('serviceEnum', {
    is: DELIVERY_SERVICE,
    then: (s) => s.required('Please enter delivery information.')
  }),
  dineInInfo: dineInSchema.when('serviceEnum', {
    is: DINEIN_SERVICE,
    then: (s) => s.required('Please enter dine-in information.')
  })
});

export interface FulfillmentSchema extends yup.InferType<typeof fulfillmentSchemaInstance> { };
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
      state.selectedService = action.payload.serviceEnum;
      if (action.payload.dineInInfo) {
        state.partySize = action.payload.dineInInfo.partySize;
      }
      if (action.payload.deliveryInfo) {
        // state.deliveryAddress = ac
      }
      state.dateTime = addMinutes(action.payload.serviceDate, action.payload.serviceTime).valueOf();
    }
  }
});



export const { setFulfillment} = WFulfillmentSlice.actions;


export default WFulfillmentSlice.reducer;
