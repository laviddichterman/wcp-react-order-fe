import { useCallback } from 'react';
import { Typography } from '@mui/material';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { ICustomerInfo, customerInfoSchema, setCustomerInfo } from '../WCustomerInfoSlice';
import { FormProvider, RHFTextField, RHFPhoneInput } from '../hook-form';
import { StepNav } from '../common';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { RHFMailTextField } from '../hook-form/RHFMailTextField';

// TODO: use funny names as the placeholder info for the names here and randomize it. So sometimes it would be the empire carpet guy, other times eagle man

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
    mode: "onBlur",

  });

  return useFormApi;
}

export function WCustomerInformationStage({ navComp }: { navComp: StepNav }) {
  const cIForm = useCIForm();
  const dispatch = useAppDispatch();
  const { getValues, formState: { isValid, errors }, handleSubmit } = cIForm;
  const onSubmitCallback = useCallback(() => {
    dispatch(setCustomerInfo(getValues()))
  }, [dispatch, getValues]);
  return (
    <>
      <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Tell us a little about you.</Typography>
      <Typography>All information is used solely to facilitate the getting of your pizza to you. We don't sell or share customer information, ever.<br />By filling out this information, you agree to receive text messages relating to your order.</Typography>
      <FormProvider methods={cIForm} >
        <span className="flexbox">
          <span className="flexbox__item one-half">
            <RHFTextField
              name="givenName"
              autoComplete="given-name name"
              label={<label className="customer-name-text">First name:</label>}
            />
          </span>
          <span className="flexbox__item one-half soft-half--left">
            <RHFTextField
              name="familyName"
              autoComplete="family-name"
              label={<label className="customer-name-text">Family name:</label>}
            />
          </span>
        </span>
        <RHFPhoneInput
          country='US'
          name="mobileNum"
          error={errors.mobileNum}
          placeholder=''
          label={<label className="phone-number-text">Mobile Phone Number:</label>}
          control={cIForm.control}
        />
        <RHFMailTextField
          name="email"
          autoComplete="email"
          label={<label className="customer-email-text">E-Mail Address:</label>}
          placeholder={"E-Mail Address"}
        />
        <RHFTextField
          name="referral"
          label={<label className="referral-info">Referral (optional):</label>}
          placeholder={"Referral"}
        />
      </FormProvider>
      {navComp(handleSubmit(onSubmitCallback), isValid, true)}
    </>
  )
};