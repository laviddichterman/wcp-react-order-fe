import { useCallback } from 'react';
import { Typography } from '@mui/material';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import PhoneInput from 'react-phone-number-input/react-hook-form-input-core';
import { ICustomerInfo, customerInfoSchema, setCustomerInfo } from '../WCustomerInfoSlice';
import { FormProvider, RHFTextField } from '../hook-form';
import { StepNav } from '../common';
import { useAppDispatch } from '../../app/useHooks';




function useCIForm() {

  const useFormApi = useForm<ICustomerInfo>({

//  seems to be a bug here where this cannot be set?
    defaultValues: {
      givenName: "",
      familyName: "",
      mobileNum: "",
      email: "",
      referral: ""
    },
    resolver: yupResolver(customerInfoSchema),
    mode: "onChange",

  });

  return useFormApi;
}

export function WCustomerInformationStage({ navComp } : { navComp : StepNav }) {
  const cIForm = useCIForm();
  const dispatch = useAppDispatch();
  const { getValues, formState: {isSubmitting, isDirty, isValid}, handleSubmit } = cIForm;
  const onSubmitCallback = useCallback(() => {
    console.log("submit")
    dispatch(setCustomerInfo(getValues()))
  }, [dispatch, getValues]);
  return (
    <>
    <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Tell us a little about you.</Typography>
      <Typography>All information is used solely to facilitate the getting of your pizza to you. We don't sell or share customer information, ever.</Typography>
      <FormProvider methods={cIForm} >
        <span className="flexbox">
          <span className="flexbox__item one-half">
            <label htmlFor="customer_name_first">
              <span className="customer-name-text">First Name:</span>
            </label>
            <input type="text" name="fname" id="customer_name_first" size={40} ng-model="orderCtrl.s.customer_name_first" ng-change="orderCtrl.ChangedContactInfo()" autoComplete="given-name" required />
          </span>
          <span className="flexbox__item one-half soft-half--left">
            <label htmlFor="customer_name_last">
              <span className="customer-name-text">Family Name:</span>
            </label>
            <input type="text" name="lname" id="customer_name_last" size={40} ng-model="orderCtrl.s.customer_name_last" ng-change="orderCtrl.ChangedContactInfo()" autoComplete="family-name" required />
          </span>
        </span>
        <label htmlFor="mobilenum">
          <span className="phone-number-text">Mobile Phone Number:</span>
        </label>
        <PhoneInput
        name="phoneNumber"
        control={cIForm.control}
        rules={{ required: true }} />

        <span className="phonenum">
          <input type="tel" id="mobilenum" name="phone_number" value="" size={40} ng-model="orderCtrl.s.phone_number" ng-change="orderCtrl.ChangedContactInfo()" autoComplete="tel" required />
        </span>
        <label htmlFor="user_email">
          <span className="user-email-text">E-mail Address:</span>
        </label>
        <span className="user-email">
          <input type="email" name="user_email" id="user_email" value="" size={40} ng-model="orderCtrl.s.email_address" ng-change="orderCtrl.ChangedContactInfo()" ng-pattern="orderCtrl.s.EMAIL_REGEX" autoComplete="email" required />
        </span>
        <div className="user-email-tip"></div>
        <label htmlFor="referral_info">
          <span className="referral-text">Referral information:</span>
        </label>
        <span className="referral-info">
          <input type="text" name="referral_info" id="referral_info" value="" size={40} ng-model="orderCtrl.s.referral" ng-change="orderCtrl.ChangedEscapableInfo()" />
        </span>
      </FormProvider>
      {navComp(handleSubmit(onSubmitCallback), !isValid , false)}
      <div className="order-nav">
        <button type="submit" className="btn" ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
        {/* <button type="submit" className="btn" ng-disabled="!stage3.$valid || orderCtrl.s.submit_failed" ng-show="orderCtrl.HasNextStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage()">{(!stage3.$valid || orderCtrl.s.submit_failed) ? "Fill out above" : "Next"}</button> */}
      </div>
    </>
  )
};