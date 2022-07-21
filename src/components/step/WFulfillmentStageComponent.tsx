import React, { useCallback, useMemo } from 'react';
import { ServicesEnableMap, WDateUtils } from '@wcp/wcpshared';
import { Autocomplete, Typography, Checkbox, Radio, RadioGroup, TextField, FormControlLabel, FormHelperText} from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import { isValid, add, getTime } from 'date-fns';
import { getTermsForService, MAX_PARTY_SIZE } from '../common';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { DELIVERY_SERVICE, DINEIN_SERVICE } from '../../config';
import { setDate, setDineInInfo, setHasAgreedToTerms, setService, setTime } from '../../app/slices/WFulfillmentSlice';
import { SelectHasOperatingHoursForService, SelectOptionsForServicesAndDate } from '../../app/store';
import { Navigation } from '../Navigation';
import { nextStage } from '../../app/slices/StepperSlice';
import DeliveryInfoForm from '../DeliveryValidationForm';

export default function WFulfillmentStageComponent() {
  const dispatch = useAppDispatch();
  const services = useAppSelector(s => s.ws.services!);
  const HasSpaceForPartyOf = useCallback((partySize: number, orderDate: Date | number, orderTime: number) => true, []);
  const HasOperatingHoursForService = useAppSelector(s => (serviceNumber: number) => SelectHasOperatingHoursForService(s, serviceNumber));
  const OptionsForServicesAndDate = useAppSelector(s=> (selectedDate : Date | number, selectedServices : ServicesEnableMap) => SelectOptionsForServicesAndDate(s, selectedDate, selectedServices));
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
    [] : OptionsForServicesAndDate(d, {[String(selectedService)]: true}), [OptionsForServicesAndDate, selectedService]);

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
  const onSetHasAgreedToTerms = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setHasAgreedToTerms(e.target.checked));
  }
  const onSetServiceDate = (v: Date | null) => {
    if (v !== null) {
      const serviceDateNumber = getTime(v);
      // check if the selected servicetime is valid in the new service date
      if (serviceTime !== null) {
        const newDateOptions = OptionsForDate(serviceDateNumber);
        const foundServiceTimeOption = newDateOptions.findIndex(x=>x.value === serviceTime);
        if (foundServiceTimeOption === -1) {
          onSetServiceTime(null)
        }
      }
      dispatch(setDate(serviceDateNumber));
    }
  }
  const onSetServiceTime = (v: number | null) => {
    dispatch(setTime(v));
  }

  const onSetDineInInfo = (v: number) => {
    dispatch(setDineInInfo({ partySize: v }));
  }

  return (<>
    <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>How and when would you like your order?</Typography>
    <span id="service-selection-radio-buttons-label">Requested Service:</span>
    <RadioGroup row onChange={onChangeServiceSelection} value={selectedService}>
      {ServiceOptions.map((option) => (
        <FormControlLabel
          key={option.value}
          value={option.value}
          control={<Radio />}
          label={option.label}
        />
      ))}
    </RadioGroup>

    {serviceTerms.length > 0 ?
      <span>
        <FormControlLabel control={
          // @ts-ignore
          <><Checkbox value={hasAgreedToTerms} onClick={(e) => onSetHasAgreedToTerms(e)} />
          </>} label={<>
            REQUIRED: For the health and safety of our staff and fellow guests, you and all members of your party understand and agree to:
            <ul>
              {serviceTerms.map((term, i) => <li key={i}>{term}</li>)}
            </ul>
          </>
          } />
      </span> : ""}
    <span className="service-date">
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
        renderInput={(params) => (
          (
            <TextField
              {...params}
            />
          )
        )}
      />
      {hasSelectedDateExpired ? <FormHelperText className="wpcf7-response-output wpcf7-mail-sent-ng" error>The previously selected service date has expired.</FormHelperText> : ""}
    </span>
    <Autocomplete
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
      sx={{ width: 300 }}
      onChange={(_, v) => onSetServiceTime(v)}
      renderInput={(params) => <TextField {...params} label="Time" />}
    />
    {hasSelectedTimeExpired ? <FormHelperText className="wpcf7-response-output wpcf7-mail-sent-ng" error>The previously selected service time has expired.</FormHelperText> : ""}
    {selectedService === DINEIN_SERVICE && serviceDate !== null && serviceTime !== null ?
      (<span>
        <Autocomplete
          disablePortal
          openOnFocus
          disableClearable
          className="guest-count"
          options={[...Array(MAX_PARTY_SIZE - 1)].map((_, i) => i + 1)}
          getOptionDisabled={o => !HasSpaceForPartyOf(o, serviceDate, serviceTime)}
          getOptionLabel={o => String(o)}
          // @ts-ignore
          value={dineInInfo?.partySize ?? null}
          sx={{ width: 300 }}
          onChange={(_, v) => onSetDineInInfo(v)}
          renderInput={(params) => <TextField {...params} label="Party Size" />}
        />
      </span>) : ""
    }
    {selectedService === DELIVERY_SERVICE && serviceDate !== null && serviceTime !== null ? <DeliveryInfoForm /> : ""}
    <Navigation canBack={false} canNext={valid} handleBack={()=>{return;}} handleNext={() => dispatch(nextStage())} />
  </>);
}