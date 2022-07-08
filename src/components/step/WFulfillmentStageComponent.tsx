import React, { useCallback, useMemo } from 'react';
import { Autocomplete, Typography, Checkbox, Radio, RadioGroup, TextField, FormControlLabel, FormHelperText, MenuItem } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';

import { isValid as isDateValid, add, startOfDay, differenceInMinutes } from 'date-fns';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getTermsForService, MAX_PARTY_SIZE, StepNav } from '../common';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { FormProvider, RHFTextField } from '../hook-form';
import { DELIVERY_LINK, DELIVERY_SERVICE, DINEIN_SERVICE } from '../../config';
import { IWSettings, JSFEBlockedOff, ServicesEnableMap, WDateUtils } from '@wcp/wcpshared';
import { DeliveryInfoRHFSchema, deliveryAddressSchema, setDate, setDeliveryInfo, setDineInInfo, setHasAgreedToTerms, setService, setTime } from '../WFulfillmentSlice';
import { useEffect } from 'react';
import { Link } from '@mui/icons-material';

export interface CartInfoToDepricate {
  cart_based_lead_time: number;
  size: number;
};

function useAvailabilityHook() {
  const services = useAppSelector(s => s.ws.services) as { [i: string]: string };
  const settings = useAppSelector(s => s.ws.settings) as IWSettings;
  const currentDateTime = useAppSelector(s => s.metrics.currentTime) as number;
  const operatingHours = useMemo(() => settings.operating_hours, [settings]);
  const blockedOff = useAppSelector(s => s.ws.blockedOff) as JSFEBlockedOff;
  const leadtimes = useAppSelector(s => s.ws.leadtime) as number[];
  const HasOperatingHoursForService = useCallback((serviceNumber: number) =>
    Object.hasOwn(services, String(serviceNumber)) && serviceNumber < operatingHours.length && operatingHours[serviceNumber].reduce((acc, dayIntervals) => acc || dayIntervals.some(v => v[0] < v[1] && v[0] >= 0 && v[1] <= 1440), false),
    [services, operatingHours]);
  const AvailabilityInfoMapForServicesAndDate = useCallback((selectedDate: number, serviceSelection: ServicesEnableMap, cartInfo: CartInfoToDepricate) =>
    WDateUtils.GetInfoMapForAvailabilityComputation(blockedOff, settings, leadtimes, selectedDate, serviceSelection, cartInfo), [settings, leadtimes, blockedOff]);
  const OptionsForServicesAndDate = useCallback((selectedDate: number, serviceSelection: ServicesEnableMap, cartInfo: CartInfoToDepricate) => {
    const INFO = AvailabilityInfoMapForServicesAndDate(selectedDate, serviceSelection, cartInfo);
    const opts = WDateUtils.GetOptionsForDate(INFO, selectedDate, currentDateTime);
    return opts;
  }, [AvailabilityInfoMapForServicesAndDate, currentDateTime])
  const HasSpaceForPartyOf = useCallback((partySize: number, orderDate: Date | number, orderTime: number) => true, []);
  return {
    currentDateTime,
    operatingHours,
    blockedOff,
    leadtimes,
    services,
    HasOperatingHoursForService,
    AvailabilityInfoMapForServicesAndDate,
    OptionsForServicesAndDate,
    HasSpaceForPartyOf
  };
}

function useDeliveryInfoForm() {
  const preExisitingDeliveryInfo = useAppSelector(s => s.fulfillment.deliveryInfo);
  const useFormApi = useForm<DeliveryInfoRHFSchema>({
    defaultValues: {
      address: preExisitingDeliveryInfo?.address ?? "",
      address2: preExisitingDeliveryInfo?.address2 ?? "",
      deliveryInstructions: preExisitingDeliveryInfo?.deliveryInstructions ?? "",
      validationStatus: preExisitingDeliveryInfo?.validationStatus ?? "UNVALIDATED",
      zipcode: preExisitingDeliveryInfo?.zipcode ?? ""

    },
    resolver: yupResolver(deliveryAddressSchema)
  });

  return useFormApi;
}

function DeliveryInfoForm() {
  const deliveryForm = useDeliveryInfoForm();
  const validationStatus = useAppSelector(s => s.fulfillment.deliveryInfo?.validationStatus ?? 'UNVALIDATED');
  const validatedDeliveryAddress = useAppSelector(s => s.fulfillment.deliveryInfo?.address);
  const validatedDeliveryAddress2 = useAppSelector(s => s.fulfillment.deliveryInfo?.address2 ?? "");
  const validatedZipcode = useAppSelector(s => s.fulfillment.deliveryInfo?.zipcode);
  const resetValidatedAddress = () => {

  };
  return (

    <>
      <span className="flexbox">
        <span className="flexbox__item one-whole">Delivery Information:</span>
      </span>
      {validationStatus === 'VALID' ?
        <div className="wpcf7-response-output wpcf7-mail-sent-ok">
          Found an address in our delivery area: <br />
          <span className="title cart">
            {`${validatedDeliveryAddress}${validatedDeliveryAddress2 ? ` ${validatedDeliveryAddress2}` : ''}, ${validatedZipcode}`}
            <button name="remove" onClick={resetValidatedAddress} className="button-remove">X</button>
          </span>
        </div>
        :
        <FormProvider methods={deliveryForm}>
          <span className="flexbox">
            <span className="flexbox__item one-half">
              <RHFTextField
                name="address"
                autoComplete="shipping address-line1"
                label={<label className="delivery-address-text">Address:</label>}
                placeholder={"Address"}
              />
            </span>
            <span className="flexbox__item one-quarter soft-half--sides">
              <RHFTextField
                name="address2"
                autoComplete="shipping address-line2"
                label={<label className="delivery-address-text">Apt/Unit:</label>}
                placeholder={"Apt/Unit"}
              />
            </span>
            <span className="flexbox__item one-quarter">
              <RHFTextField
                name="zipcode"
                autoComplete="shipping postal-code"
                label={<label className="delivery-address-text">ZIP Code:</label>}
                placeholder={"ZIP Code"}
              />
            </span>
          </span>
        </FormProvider>
      }
      {validationStatus === 'OUTSIDE_RANGE' ?
        <div className="wpcf7-response-output wpcf7-mail-sent-ng">
          The address {validatedDeliveryAddress} isn't in our <Link target="_blank" href={DELIVERY_LINK}>delivery area</Link>
        </div> : ""
      }
      {validationStatus === 'INVALID' ?
        <div className="wpcf7-response-output wpcf7-mail-sent-ng">
          Unable to determine the specified address. Send us a text or email if you continue having issues.
        </div> : ""
      }


      <span className="flexbox" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY">
        <span className="flexbox__item one-whole">
          <label htmlFor="delivery-instructions-text">
            <span className="delivery-instructions-text">Delivery Instructions (optional):</span>
          </label>
          <input type="text" id="delivery-instructions-text" name="delivery_instructions" size={40} ng-model="orderCtrl.s.delivery_instructions" ng-change="orderCtrl.ChangedEscapableInfo()" />
        </span>
      </span>
      <button type="submit" className="btn" ng-click="orderCtrl.ValidateDeliveryAddress()">Validate Delivery Address</button>
    </>
  )
}


export function WFulfillmentStageComponent({ navComp }: { navComp: StepNav }) {
  const dispatch = useAppDispatch();
  const availability = useAvailabilityHook();
  const { services, HasOperatingHoursForService, OptionsForServicesAndDate, HasSpaceForPartyOf } = availability;
  const selectedService = useAppSelector(s => s.fulfillment.selectedService);
  const serviceDate = useAppSelector(s => s.fulfillment.selectedDate);
  const serviceTime = useAppSelector(s => s.fulfillment.selectedTime);
  const serviceTerms = useMemo(() => {
    return selectedService !== null ? getTermsForService(selectedService) : [];
  }, [selectedService]);
  const hasAgreedToTerms = useAppSelector(s => s.fulfillment.hasAgreedToTerms);
  const dineInInfo = useAppSelector(s => s.fulfillment.dineInInfo);
  const hasSelectedTimeExpired = useAppSelector(s => s.fulfillment.hasSelectedTimeExpired); // this needs to watch whatever we have selected but not submitted
  const hasSelectedDateExpired = useAppSelector(s => s.fulfillment.hasSelectedDateExpired); // this needs to watch whatever we have selected but not submitted
  const valid = useMemo(() => {
    return selectedService !== null && serviceDate !== null && serviceTime !== null &&
      ((serviceTerms.length > 0 && hasAgreedToTerms) || serviceTerms.length === 0) &&
      !hasSelectedTimeExpired && !hasSelectedDateExpired;
  }, [selectedService, serviceDate, serviceTime, hasSelectedTimeExpired, hasSelectedDateExpired, hasAgreedToTerms, serviceTerms])
  const onChangeServiceSelection = (event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    const serviceNum = parseInt(value, 10);
    if (Number.isInteger(serviceNum)) {
      dispatch(setService(serviceNum));
    }
  }
  const onSetHasAgreedToTerms = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    dispatch(setHasAgreedToTerms(checked));
  }
  const onSetServiceDate = (v: Date | null) => {
    if (v !== null) {
      dispatch(setDate(v.valueOf()));
    }
  }
  const onSetServiceTime = (v: number) => {
    dispatch(setTime(v));
  }

  const onSetDineInInfo = (v: number) => {
    dispatch(setDineInInfo({ partySize: v }));
  }

  const OptionsForDate = useCallback((d: number | null) => {
    if (selectedService === null || d === null || !isDateValid(d)) {
      return [];
    }
    const serviceSelectionMap: { [index: string]: boolean } = {};
    serviceSelectionMap[String(selectedService)] = true;
    return OptionsForServicesAndDate(d, serviceSelectionMap, { size: 0, cart_based_lead_time: 0 });
  }, [OptionsForServicesAndDate, selectedService]);

  const canSelectService = useCallback((service: number) => true, []);
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
          <><Checkbox value={hasAgreedToTerms} onChange={onSetHasAgreedToTerms} />
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
        shouldDisableDate={(e: Date) => OptionsForDate(e.valueOf()).length === 0}
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
      disablePortal
      openOnFocus
      disableClearable
      noOptionsText="Select a valid service date first"
      id="service-time"
      options={OptionsForDate(serviceDate)}
      isOptionEqualToValue={(o, v) => o.value === v.value}
      getOptionDisabled={o => o.disabled}
      getOptionLabel={o => WDateUtils.MinutesToPrintTime(o.value)}
      value={serviceTime !== null ? { disabled: false, value: serviceTime } : null}
      sx={{ width: 300 }}
      onChange={(e, v) => onSetServiceTime(v.value)}
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
          value={dineInInfo?.partySize}
          sx={{ width: 300 }}
          onChange={(_, v) => onSetDineInInfo(v)}
          renderInput={(params) => <TextField {...params} label="Party Size" />}
        />
      </span>) : ""
    }
    {selectedService === DELIVERY_SERVICE && serviceDate !== null && serviceTime !== null ? <DeliveryInfoForm /> : ""}
    {navComp(() => { return; }, valid, false)}
  </>);
}