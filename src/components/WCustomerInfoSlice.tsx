import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as yup from "yup";
import {
  parsePhoneNumber,
} from 'libphonenumber-js/core';
import { LIBPHONE_METADATA } from "./common";

export interface ICustomerInfo { 
  givenName: string;
  familyName: string;
  mobileNum: string;
  email: string;
  referral: string;

}
export const customerInfoSchema = yup.object().shape({
  givenName: yup.string().ensure().required("Please enter your given name.").min(2, "Please enter the full name."),
  familyName: yup.string().ensure().required("Please enter your family name.").min(2, "Please enter the full name."),
  mobileNum: yup.string().ensure().required("Please enter a valid US mobile phone number.").test('mobileNum', 
    "Please enter a valid US mobile phone number.", 
    ( v ) => {
      try {
        const parsedNumber = parsePhoneNumber(v, LIBPHONE_METADATA);
        return parsedNumber.isValid();
      }
      catch (e) {
        return false;
      }
    }),
  email: yup.string().ensure()
    .email("Please enter a valid e-mail address.")
    .required("Please enter a valid e-mail address.")
    .min(5, "Valid e-mail addresses are longer.")
    .test('DotCon',
    ".con is not a valid TLD. Did you mean .com?",
    (v) => v.substring(v.length - 3) === 'con' ? false : true),
  referral: yup.string().ensure().notRequired()
});

const initialState: ICustomerInfo = {
  givenName: "",
  familyName: "",
  mobileNum: "",
  email: "",
  referral: ""
}

const WCustomerInfoSlice = createSlice({
  name: 'ci',
  initialState: initialState,
  reducers: {
    setCustomerInfo(state, action : PayloadAction<ICustomerInfo>) {
      state = { ...action.payload };
    }
  }
});



export const { setCustomerInfo } = WCustomerInfoSlice.actions;


export default WCustomerInfoSlice.reducer;
