import { useEffect } from 'react';
import { Typography, Grid } from '@mui/material';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { CustomerInfoRHF, customerInfoSchema, setCustomerInfo } from '../../app/slices/WCustomerInfoSlice';
import { FormProvider, RHFTextField, RHFPhoneInput } from '../hook-form';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { RHFMailTextField } from '../hook-form/RHFMailTextField';
import { Navigation } from '../Navigation';
import { backStage, nextStage } from '../../app/slices/StepperSlice';
import { StageTitle } from '../styled/styled';

// TODO: use funny names as the placeholder info for the names here and randomize it. So sometimes it would be the empire carpet guy, other times eagle man

function useCIForm() {
  const useFormApi = useForm<CustomerInfoRHF>({
    defaultValues: {
      givenName: useAppSelector(s => s.ci.givenName),
      familyName: useAppSelector(s => s.ci.familyName),
      mobileNum: useAppSelector(s => s.ci.mobileNum),
      mobileNumRaw: useAppSelector(s => s.ci.mobileNumRaw),
      email: useAppSelector(s => s.ci.email),
      referral: useAppSelector(s => s.ci.referral)
    },
    resolver: yupResolver(customerInfoSchema),
    mode: "onBlur",

  });

  return useFormApi;
}

export function WCustomerInformationStage() {
  const cIForm = useCIForm();
  const dispatch = useAppDispatch();
  const { getValues, watch, formState: { isValid, errors, isDirty }, handleSubmit } = cIForm;
  const handleNext = () => {
    dispatch(setCustomerInfo(getValues()));
    dispatch(nextStage());
  }
  useEffect(() => {
    if (isValid) {
      dispatch(setCustomerInfo(watch()));
    }
  }, [isValid, isDirty, watch, dispatch])
  return (
    <>
      <StageTitle>Tell us a little about you.</StageTitle>
      <Typography>All information is used solely to facilitate the getting of your pizza to you. We don't sell or share customer information, ever.<br />By filling out this information, you agree to receive text messages relating to your order.</Typography>
      <FormProvider methods={cIForm}>
        <Grid sx={{ p: 2 }} container>
          <Grid item sx={{ p: 1 }} xs={6}>
            <RHFTextField
              name="givenName"
              autoComplete="given-name name"
              label={<label className="customer-name-text">First name:</label>}
            />
          </Grid>
          <Grid item sx={{ p: 1 }} xs={6}>
            <RHFTextField
              name="familyName"
              autoComplete="family-name"
              label={<label className="customer-name-text">Family name:</label>}
            />
          </Grid>
          <Grid item xs={12} sx={{ p: 1 }}>
            <RHFPhoneInput
              country='US'
              fullWidth
              name="mobileNumRaw"
              error={errors.mobileNumRaw}
              label={<label className="phone-number-text">Mobile Phone Number:</label>}
              control={cIForm.control}
            />
          </Grid>
          <Grid item xs={12} sx={{ p: 1 }}>
            <RHFMailTextField
              name="email"
              autoComplete="email"
              label={<label className="customer-email-text">E-Mail Address:</label>}
            />
          </Grid>
          <Grid item xs={12} sx={{ px: 1, pt: 1 }}>
            <RHFTextField
              name="referral"
              label={<label className="referral-info">Referral (optional):</label>}
            />
          </Grid>
        </Grid>
      </FormProvider>
      <Navigation canBack canNext={isValid} handleBack={() => dispatch(backStage())} handleNext={handleSubmit(handleNext)} />
    </>
  )
};