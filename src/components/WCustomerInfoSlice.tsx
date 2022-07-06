import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as yup from "yup";

export interface ICustomerInfo { 
  givenName: string;
  familyName: string;
  mobileNum: string;
  email: string;
  referral: string;

}
export const customerInfoSchema = yup.object().shape({
  givenName: yup.string().required("Please enter your given name."),
  familyName: yup.string().required("Please enter your family name."),
  mobileNum: yup.string(),
  email: yup.string().default("").email().required(),
  referral: yup.string().default("").notRequired()
});

//export interface ICustomerInfo extends yup.InferType<typeof customerInfoSchema> { };


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
