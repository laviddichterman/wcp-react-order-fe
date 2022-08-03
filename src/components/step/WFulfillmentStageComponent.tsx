import React, { useCallback, useMemo } from 'react';
import { ServicesEnableMap, WDateUtils } from '@wcp/wcpshared';
import { Autocomplete, Grid, Checkbox, Radio, RadioGroup, TextField, FormControlLabel } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import { isValid, add, getTime } from 'date-fns';
import { getTermsForService } from '../common';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { DELIVERY_SERVICE, DINEIN_SERVICE } from '../../config';
import { setDate, setDineInInfo, setHasAgreedToTerms, setService, setTime } from '../../app/slices/WFulfillmentSlice';
import { SelectHasOperatingHoursForService, SelectMaxPartySize, SelectOptionsForServicesAndDate } from '../../app/store';
import { Navigation } from '../Navigation';
import { nextStage } from '../../app/slices/StepperSlice';
import DeliveryInfoForm from '../DeliveryValidationForm';
import { setTimeToServiceDate, setTimeToServiceTime } from '../../app/slices/WMetricsSlice';
import { Separator, StageTitle } from '../styled/styled';

export default function WFulfillmentStageComponent() {
  const dispatch = useAppDispatch();
  const MAX_PARTY_SIZE = useAppSelector(SelectMaxPartySize);
  const services = useAppSelector(s => s.ws.services!);
  const HasSpaceForPartyOf = useCallback((partySize: number, orderDate: Date | number, orderTime: number) => true, []);
  const HasOperatingHoursForService = useAppSelector(s => (serviceNumber: number) => SelectHasOperatingHoursForService(s, serviceNumber));
  const OptionsForServicesAndDate = useAppSelector(s => (selectedDate: Date | number, selectedServices: ServicesEnableMap) => SelectOptionsForServicesAndDate(s, selectedDate, selectedServices));
  const selectedService = useAppSelector(s => s.fulfillment.selectedService);
  const serviceDate = useAppSelector(s => s.fulfillment.selectedDate);
  const serviceTime = useAppSelector(s => s.fulfillment.selectedTime);
  const serviceTerms = useMemo(() => selectedService !== null ? getTermsForService(selectedService) : [], [selectedService]);
  const hasAgreedToTerms = useAppSelector(s => s.fulfillment.hasAgreedToTerms);
  const dineInInfo = useAppSelector(s => s.fulfillment.dineInInfo);
  const deliveryInfo = useAppSelector(s => s.fulfillment.deliveryInfo);
  const hasSelectedTimeExpired = useAppSelector(s => s.fulfillment.hasSelectedTimeExpired);
  const hasSelectedDateExpired = useAppSelector(s => s.fulfillment.hasSelectedDateExpired);
  const valid = useMemo(() => {
    return selectedService !== null && serviceDate !== null && serviceTime !== null &&
      (serviceTerms.length === 0 || hasAgreedToTerms) &&
      (selectedService !== DINEIN_SERVICE || dineInInfo !== null) &&
      (selectedService !== DELIVERY_SERVICE || deliveryInfo !== null);
  }, [selectedService, serviceDate, serviceTime, serviceTerms.length, hasAgreedToTerms, dineInInfo, deliveryInfo]);

  const OptionsForDate = useCallback((d: number | null) => (selectedService === null || d === null || !isValid(d)) ?
    [] : OptionsForServicesAndDate(d, { [String(selectedService)]: true }), [OptionsForServicesAndDate, selectedService]);

  const canSelectService = useCallback((service: number) => true, []);

  const TimeOptions = useMemo(() => serviceDate !== null ? OptionsForDate(serviceDate).reduce((acc: { [index: number]: { value: number, disabled: boolean } }, v) => ({ ...acc, [v.value]: v }), {}) : {}, [OptionsForDate, serviceDate]);

  const ServiceOptions = useMemo(() => {
    return Object.entries(services).filter(([serviceNum, _]) =>
      HasOperatingHoursForService(parseInt(serviceNum, 10))).map(([serviceNum, serviceName]) => {
        const parsedNum = parseInt(serviceNum, 10);
        return { label: serviceName, value: parsedNum, disabled: !canSelectService(parsedNum) };
      });
  }, [services, canSelectService, HasOperatingHoursForService]);
  if (services === null || ServiceOptions.length === 0) {
    return null;
  }

  const onChangeServiceSelection = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    const serviceNum = parseInt(value, 10);
    if (Number.isInteger(serviceNum)) {
      dispatch(setService(serviceNum));
    }
  }
  const onSetHasAgreedToTerms = () => {
    dispatch(setHasAgreedToTerms(!hasAgreedToTerms));
  }
  const onSetServiceDate = (v: Date | null) => {
    if (v !== null) {
      const serviceDateNumber = getTime(v);
      // check if the selected servicetime is valid in the new service date
      if (serviceTime !== null) {
        const newDateOptions = OptionsForDate(serviceDateNumber);
        const foundServiceTimeOption = newDateOptions.findIndex(x => x.value === serviceTime);
        if (foundServiceTimeOption === -1) {
          onSetServiceTime(null)
        }
      }
      dispatch(setDate(serviceDateNumber));
      dispatch(setTimeToServiceDate(Date.now()));
    }
  }
  const onSetServiceTime = (v: number | null) => {
    dispatch(setTime(v));
    v !== null && dispatch(setTimeToServiceTime(Date.now()));
  }

  const onSetDineInInfo = (v: number) => {
    dispatch(setDineInInfo({ partySize: v }));
  }

  return (<>
    <StageTitle>How and when would you like your order?</StageTitle>
    <Separator sx={{ pb: 3 }} />
    <Grid container alignItems="center">
      <Grid item xs={12} xl={4} sx={{ pl: 3, pb: 5 }}><span>Requested Service:</span>
        <RadioGroup
          row onChange={onChangeServiceSelection} value={selectedService}>
          {ServiceOptions.map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={<Radio />}
              label={option.label}
            />
          ))}
        </RadioGroup>
      </Grid>
      {serviceTerms.length > 0 ?
        <Grid item xs={12} xl={8}>
          <FormControlLabel control={
            <><Checkbox value={hasAgreedToTerms} onClick={() => onSetHasAgreedToTerms()} />
            </>} label={<>
              REQUIRED: For the health and safety of our staff and fellow guests, you and all members of your party understand and agree to:
              <ul>
                {serviceTerms.map((term, i) => <li key={i}>{term}</li>)}
              </ul>
            </>
            } />
        </Grid> : ""}
      <Grid item xs={12} xl={serviceTerms.length > 0 ? 6 : 4} lg={6} sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex', pb: 3 }}>
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          openTo="day"
          disablePast
          label={selectedService === null ? "Select a requested service first" : "Service Date"}
          maxDate={add(new Date(), { days: 60 })}
          shouldDisableDate={(e: Date) => OptionsForDate(getTime(e)).length === 0}
          disableMaskedInput
          value={serviceDate}
          onChange={(v) => onSetServiceDate(v)}
          renderInput={(params) => <TextField {...params} error={hasSelectedDateExpired} helperText={hasSelectedDateExpired ? "The previously selected service date has expired." : null} />}
        />
      </Grid>
      <Grid item xs={12} container xl={serviceTerms.length > 0 ? 6 : 4} lg={6} sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex' }} >
        <Grid item xs={12}>
          <Autocomplete
            sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex', width: 300, margin: 'auto' }}
            openOnFocus
            disableClearable
            noOptionsText="Select a valid service date first"
            id="service-time"
            options={Object.values(TimeOptions).map(x => x.value)}
            getOptionDisabled={o => TimeOptions[o].disabled}
            isOptionEqualToValue={(o, v) => o === v}
            getOptionLabel={o => o ? WDateUtils.MinutesToPrintTime(o) : ""}
            // @ts-ignore
            value={serviceTime || null}
            //sx={{ width: 300 }}
            onChange={(_, v) => onSetServiceTime(v)}
            renderInput={(params) => <TextField {...params} label="Time" error={hasSelectedTimeExpired} helperText={hasSelectedTimeExpired ? "The previously selected service time has expired." : null} />}
          />
        </Grid>
        {(selectedService === DINEIN_SERVICE && serviceDate !== null) &&
          (<Grid item xs={12} sx={{ pt: 5, pb: 2 }}>
            <Autocomplete
              sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex', width: 300, margin: 'auto' }}
              disablePortal
              openOnFocus
              disableClearable
              disabled={serviceTime === null}
              className="guest-count"
              options={[...Array(MAX_PARTY_SIZE - 1)].map((_, i) => i + 1)}
              getOptionDisabled={o => serviceTime === null || !HasSpaceForPartyOf(o, serviceDate, serviceTime)}
              getOptionLabel={o => String(o)}
              // @ts-ignore
              value={dineInInfo?.partySize ?? null}
              onChange={(_, v) => onSetDineInInfo(v)}
              renderInput={(params) => <TextField {...params} label="Party Size" />}
            />
          </Grid>)}
      </Grid>
      {(selectedService === DELIVERY_SERVICE && serviceDate !== null) &&
          <Grid item xs={12}>
            <DeliveryInfoForm />
          </Grid>}
    </Grid>
    <Navigation hasBack={false} canBack={false} canNext={valid} handleBack={() => { return; }} handleNext={() => dispatch(nextStage())} />
  </>);
}