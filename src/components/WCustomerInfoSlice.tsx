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
  givenName: yup.string().ensure().required("Please enter your given name."),
  familyName: yup.string().ensure().required("Please enter your family name."),
  mobileNum: yup.string().ensure(),
  email: yup.string().ensure().email().required(),
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
