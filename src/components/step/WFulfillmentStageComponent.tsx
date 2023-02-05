import React, { useCallback, useMemo } from 'react';
import { FulfillmentType, WDateUtils } from '@wcp/wcpshared';
import { Autocomplete, Grid, Checkbox, Radio, RadioGroup, TextField, FormControlLabel } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';
import { isValid, add, formatISO, parseISO, startOfDay } from 'date-fns';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { setDate, setDineInInfo, setHasAgreedToTerms, setService, setTime } from '../../app/slices/WFulfillmentSlice';
import { SelectHasOperatingHoursForService, SelectOptionsForServicesAndDate } from '../../app/store';
import { Navigation } from '../Navigation';
import { nextStage } from '../../app/slices/StepperSlice';
import DeliveryInfoForm from '../DeliveryValidationForm';
import { setTimeToServiceDate, setTimeToServiceTime } from '../../app/slices/WMetricsSlice';
import { StageTitle, Separator } from '@wcp/wario-ux-shared';

export default function WFulfillmentStageComponent() {
  const dispatch = useAppDispatch();
  const fulfillments = useAppSelector(s => s.ws.fulfillments!);
  const HasSpaceForPartyOf = useCallback((partySize: number, orderDate: string, orderTime: number) => true, []);
  const HasOperatingHoursForService = useAppSelector(s => (fulfillmentId: string) => SelectHasOperatingHoursForService(s, fulfillmentId));
  const OptionsForServicesAndDate = useAppSelector(s => (selectedDate: string, selectedServices: string[]) => SelectOptionsForServicesAndDate(s, selectedDate, selectedServices));
  const currentTime = useAppSelector(s=>s.ws.currentTime);
  const selectedService = useAppSelector(s => s.fulfillment.selectedService);
  const serviceDate = useAppSelector(s => s.fulfillment.selectedDate);
  const serviceTime = useAppSelector(s => s.fulfillment.selectedTime);
  const serviceTerms = useMemo(() => selectedService !== null ? fulfillments[selectedService].terms : [], [fulfillments, selectedService]);
  const hasAgreedToTerms = useAppSelector(s => s.fulfillment.hasAgreedToTerms);
  const dineInInfo = useAppSelector(s => s.fulfillment.dineInInfo);
  const deliveryInfo = useAppSelector(s => s.fulfillment.deliveryInfo);
  const hasSelectedTimeExpired = useAppSelector(s => s.fulfillment.hasSelectedTimeExpired);
  const hasSelectedDateExpired = useAppSelector(s => s.fulfillment.hasSelectedDateExpired);
  const valid = useMemo(() => {
    return selectedService !== null && serviceDate !== null && serviceTime !== null &&
      (serviceTerms.length === 0 || hasAgreedToTerms) &&
      (fulfillments[selectedService].service !== FulfillmentType.DineIn || dineInInfo !== null) &&
      (fulfillments[selectedService].service !== FulfillmentType.Delivery || deliveryInfo !== null);
  }, [fulfillments, selectedService, serviceDate, serviceTime, serviceTerms.length, hasAgreedToTerms, dineInInfo, deliveryInfo]);

  const OptionsForDate = useCallback((d: string | null) => {
    if (selectedService !== null && d !== null) {
      const parsedDate = parseISO(d);
      if (isValid(parsedDate)) {
        return OptionsForServicesAndDate(d, [selectedService]);
      }
    }
    return [];
  }, [OptionsForServicesAndDate, selectedService]);

  const canSelectService = useCallback((fId: string) => true, []);

  const TimeOptions = useMemo(() => serviceDate !== null ? OptionsForDate(serviceDate).reduce((acc: { [index: number]: { value: number, disabled: boolean } }, v) => ({ ...acc, [v.value]: v }), {}) : {}, [OptionsForDate, serviceDate]);

  const ServiceOptions = useMemo(() => {
    return Object.values(fulfillments).filter((fulfillment) =>
      fulfillment.exposeFulfillment && HasOperatingHoursForService(fulfillment.id)).map((fulfillment) => {
        return { label: fulfillment.displayName, value: fulfillment.id, disabled: !canSelectService(fulfillment.id) };
      });
  }, [fulfillments, canSelectService, HasOperatingHoursForService]);

  const onChangeServiceSelection = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    dispatch(setService(value));
  }
  const onSetHasAgreedToTerms = (checked: boolean) => {
    dispatch(setHasAgreedToTerms(checked));
  }
  const onSetServiceDate = (v: Date | number | null) => {
    if (v !== null) {
      const serviceDateString = formatISO(v, {representation: 'date'});
      // check if the selected servicetime is valid in the new service date
      if (serviceTime !== null) {
        const newDateOptions = OptionsForDate(serviceDateString);
        const foundServiceTimeOption = newDateOptions.findIndex(x => x.value === serviceTime);
        if (foundServiceTimeOption === -1) {
          onSetServiceTime(null)
        }
      }
      dispatch(setDate(serviceDateString));
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
    {/* <div>Current Time as computed... {formatISO(currentTime)}</div>
    <div>Browser thinks it is... {formatISO(Date.now())}</div>
    <div>Selected Service? {JSON.stringify(selectedService)}</div>
    <div>Service Date {serviceDate ? serviceDate : "none"} in ISO Date {serviceDate ? formatISO(parseISO(serviceDate)) : "none"}</div> */}
    <Grid container alignItems="center">
      <Grid item xs={12} xl={4} sx={{ pl: 3, pb: 5 }}>
        <span>Requested Service:</span>
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
      <Grid sx={serviceTerms.length === 0 ? { display: 'none'} : {}} item xs={12} xl={8}>
        <FormControlLabel control={
          <><Checkbox checked={hasAgreedToTerms} onChange={(_, checked) => onSetHasAgreedToTerms(checked)} />
          </>} label={<>
            REQUIRED: For the health and safety of our staff and fellow guests, you and all members of your party understand and agree to:
            <ul>
              {serviceTerms.map((term, i) => <li key={i}>{term}</li>)}
            </ul>
          </>
          } />
      </Grid>
      
      <Grid item xs={12} xl={serviceTerms.length > 0 ? 6 : 4} lg={6} sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex', pb: 3, ...(selectedService === null ? { display: 'none'} : {})}}>
        <StaticDatePicker
          displayStaticWrapperAs="desktop"
          openTo="day"
          disablePast
          label={selectedService === null ? "Select a requested service first" : "Service Date"}
          minDate={startOfDay(currentTime)}
          maxDate={add(currentTime, { days: 6 })}
          shouldDisableDate={(e: Date) => OptionsForDate(formatISO(e, {representation: 'date'})).length === 0}
          disableMaskedInput
          value={serviceDate ? parseISO(serviceDate) : ""}
          onChange={(v) => onSetServiceDate(v)}
          renderInput={(params) => <TextField {...params} error={hasSelectedDateExpired} helperText={hasSelectedDateExpired ? "The previously selected service date has expired." : null} />}
        />
      </Grid>
      <Grid item xs={12} container xl={serviceTerms.length > 0 ? 6 : 4} lg={6} sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex', ...(selectedService === null ? { display: 'none'} : {}) }} >
        <Grid item xs={12} sx={{ pb: 5 }}>
          <Autocomplete
            sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex', width: 300, margin: 'auto' }}
            openOnFocus
            disableClearable
            noOptionsText={"Select an available service date first"}
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
        {(selectedService !== null && fulfillments[selectedService].service === FulfillmentType.DineIn && serviceDate !== null) &&
          (<Grid item xs={12} sx={{ pb: 5 }}>
            <Autocomplete
              sx={{ justifyContent: 'center', alignContent: 'center', display: 'flex', width: 300, margin: 'auto' }}
              disablePortal
              openOnFocus
              disableClearable
              disabled={serviceTime === null}
              className="guest-count"
              options={[...Array((fulfillments[selectedService].maxGuests ?? 50) - 1)].map((_, i) => i + 1)}
              getOptionDisabled={o => serviceTime === null || !HasSpaceForPartyOf(o, serviceDate, serviceTime)}
              getOptionLabel={o => String(o)}
              // @ts-ignore
              value={dineInInfo?.partySize ?? null}
              onChange={(_, v) => onSetDineInInfo(v)}
              renderInput={(params) => <TextField {...params} label="Party Size" />}
            />
          </Grid>)}
      </Grid>
      {(selectedService !== null && fulfillments[selectedService].service === FulfillmentType.Delivery && serviceDate !== null) &&
        <Grid item xs={12}>
          <DeliveryInfoForm />
        </Grid>}
    </Grid>
    <Navigation hidden={serviceTime === null} hasBack={false} canBack={false} canNext={valid} handleBack={() => { return; }} handleNext={() => dispatch(nextStage())} />
  </>);
}