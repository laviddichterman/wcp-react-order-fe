import { useCallback } from 'react';
import { Typography } from '@mui/material';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ICustomerInfo, customerInfoSchema, setCustomerInfo } from '../WCustomerInfoSlice';
import { FormProvider, RHFTextField, RHFPhoneInput } from '../hook-form';
import { StepNav } from '../common';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';

function useCIForm() {
  const useFormApi = useForm<ICustomerInfo>({

    //  seems to be a bug here where this cannot be set?
    defaultValues: {
      givenName: useAppSelector(s => s.ci.givenName),
      familyName: useAppSelector(s => s.ci.familyName),
      mobileNum: useAppSelector(s => s.ci.mobileNum),
      email: useAppSelector(s => s.ci.email),
      referral: useAppSelector(s => s.ci.referral)
    },
    resolver: yupResolver(customerInfoSchema),
    mode: "onChange",

  });

  return useFormApi;
}

export function WCustomerInformationStage({ navComp }: { navComp: StepNav }) {
  const cIForm = useCIForm();
  const dispatch = useAppDispatch();
  const { getValues, formState: { isValid }, handleSubmit } = cIForm;
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
            <RHFTextField
              name="givenName"
              autoComplete="given-name name"
              label={<label className="customer-name-text">First name:</label>}
              placeholder={"First Name"}
            />
          </span>
          <span className="flexbox__item one-half soft-half--left">
            <RHFTextField
              name="familyName"
              autoComplete="family-name"
              label={<label className="customer-name-text">Family name:</label>}
              placeholder={"Family Name"}
            />
          </span>
        </span>
        <RHFPhoneInput
          country='US'
          name="phoneNumber"
          placeholder=''
          label={<label className="phone-number-text">Mobile Phone Number:</label>}
          control={cIForm.control}
          rules={{ required: true }} />
        <RHFTextField
          name="email"
          autoComplete="email"
          label={<label className="customer-email-text">E-Mail Address:</label>}
          placeholder={"E-Mail Address"}
        />
        <div className="user-email-tip"></div>
        <RHFTextField
          name="referral"

          label={<label className="referral-info">Referral (optional):</label>}
          placeholder={"Referral"}
        />
      </FormProvider>
      {navComp(handleSubmit(onSubmitCallback), !isValid, true)}
    </>
  )
};