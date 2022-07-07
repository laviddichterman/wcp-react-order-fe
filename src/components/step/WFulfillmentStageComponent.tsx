import React, { useCallback, useMemo } from 'react';
import { Typography, FormHelperText } from '@mui/material';

import { isValid as isDateValid, add, startOfDay, differenceInMinutes } from 'date-fns';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getTermsForService, MAX_PARTY_SIZE, StepNav, SERVICE_DATE_FORMAT } from '../common';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { FormProvider, RHFPhoneInput, RHFCheckbox, RHFRadioGroup, RHFDatePicker, RHFSelect } from '../hook-form';
import { DELIVERY_LINK, DELIVERY_SERVICE, DINEIN_SERVICE } from '../../config';
import { IWSettings, JSFEBlockedOff, ServicesEnableMap, WDateUtils } from '@wcp/wcpshared';
import { AggreedToTermsSchema, BaseFulfillmentInfoSchema, DineInInfoRHFSchema, dineInSchema, fulfillmentSchemaInstance, setFulfillment } from '../WFulfillmentSlice';
import { useEffect } from 'react';

export interface CartInfoToDepricate {
  cart_based_lead_time: number;
  size: number;
};

function useAvailabilityHook() {
  const services = useAppSelector(s => s.ws.services) as { [i: string]: string };
  const settings = useAppSelector(s => s.ws.settings) as IWSettings;
  const currentDate = useAppSelector(s => s.metrics.currentTime) as number;
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
    const opts = WDateUtils.GetOptionsForDate(INFO, selectedDate, new Date(currentDate));
    return opts;
  }, [AvailabilityInfoMapForServicesAndDate, currentDate])
  return {
    operatingHours,
    blockedOff,
    leadtimes,
    services,
    HasOperatingHoursForService,
    AvailabilityInfoMapForServicesAndDate,
    OptionsForServicesAndDate
  };
}

function useFulfillmentForm() {
  const preselectedServiceDate = useAppSelector(s => s.fulfillment.dateTime);
  const beginningOfPreselectedDate = useMemo(() => preselectedServiceDate ? startOfDay(preselectedServiceDate) : null, [preselectedServiceDate]);
  const useFormApi = useForm<BaseFulfillmentInfoSchema & AggreedToTermsSchema>({
    defaultValues: {
      serviceNum: useAppSelector(s => s.fulfillment.selectedService)?.toString(),
      serviceDate: beginningOfPreselectedDate?.valueOf(),
      serviceTime: preselectedServiceDate ? differenceInMinutes(preselectedServiceDate, beginningOfPreselectedDate as Date) : undefined,
      hasAgreedToTerms: useAppSelector(s=>s.fulfillment.hasAgreedToTerms)
    },
    resolver: yupResolver(fulfillmentSchemaInstance),
    mode: "onChange",
  });

  return useFormApi;
}

function useDineInInfoForm() {
  const preSelectedPartySize = useAppSelector(s => s.fulfillment.dineInInfo?.partySize);
  const useFormApi = useForm<DineInInfoRHFSchema>({
    defaultValues: {
      partySize: preSelectedPartySize
    },
    resolver: yupResolver(dineInSchema),
    mode: "onChange",
  });
  return useFormApi;
}

export function WFulfillmentStageComponent({ navComp }: { navComp: StepNav }) {
  const dispatch = useAppDispatch();
  const availability = useAvailabilityHook();
  const hasSelectedTimeExpired = useAppSelector(s=>s.fulfillment.hasSelectedTimeExpired); // this needs to watch whatever we have selected but not submitted
  const hasSelectedDateExpired = useAppSelector(s=>s.fulfillment.hasSelectedDateExpired); // this needs to watch whatever we have selected but not submitted
  const { services, HasOperatingHoursForService, OptionsForServicesAndDate } = availability;
  const fulfillmentForm = useFulfillmentForm();
  const dineInForm = useDineInInfoForm();
  const { reset: resetDineInForm,     getValues: getValuesDineInForm, 
  } = dineInForm;
  const { watch: watchFulfillmentForm, 
    getValues: getValuesFulfillmentForm, 
    reset: resetFulfillmentForm,
    formState: { errors: errorsFulfillmentForm, isValid }, handleSubmit } = fulfillmentForm;
  const valuesFulfillmentForm = watchFulfillmentForm();
  const { serviceNum, serviceDate } = valuesFulfillmentForm;
  const serviceTerms = useMemo(() => {
    const num = parseInt(serviceNum, 10);
    return Number.isInteger(num) ? getTermsForService(parseInt(serviceNum, 10)) : [];
  }, [serviceNum]);
  const OptionsForDate = useCallback((d: number) => {
    if (serviceNum === "" || !isDateValid(d)) {
      return [];
    }
    const serviceSelectionMap: { [index: string]: boolean } = {};
    serviceSelectionMap[String(serviceNum)] = true;
    return OptionsForServicesAndDate(d, serviceSelectionMap, { size: 0, cart_based_lead_time: 0 });
  }, [OptionsForServicesAndDate, serviceNum]);
  
  // this resets our forms when we change the serviceNum
  useEffect(() => {
    resetFulfillmentForm({...getValuesFulfillmentForm(), hasAgreedToTerms: false});
    resetDineInForm();
    //resetDeliveryForm();
  }, [getValuesFulfillmentForm, resetFulfillmentForm, resetDineInForm, serviceNum])
  const canSelectService = useCallback((service: number) => true, []);
  const ServiceOptions = useMemo(() => {
    return Object.entries(services).filter(([serviceNum, _]) =>
      HasOperatingHoursForService(parseInt(serviceNum, 10))).map(([serviceNum, serviceName]) => {
        const parsedNum = parseInt(serviceNum, 10);
        return { label: serviceName, value: parsedNum, disabled: !canSelectService(parsedNum) };
      });
  }, [services, canSelectService, HasOperatingHoursForService]);
  const onSubmitCallback = () => {
    console.log("submit")

    dispatch(setFulfillment({...getValuesFulfillmentForm(), dineInInfo: getValuesDineInForm(), deliveryInfo: null}))
  };
  if (services === null || ServiceOptions.length === 0) {
    return null;
  }
  return (<>
    <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>How and when would you like your order?</Typography>
    <div>Service Enum: {serviceNum}</div>
    <FormProvider methods={fulfillmentForm} >

      <span id="service-selection-radio-buttons-label">Requested Service:</span>
      <RHFRadioGroup name="serviceNum" options={ServiceOptions} />
      {serviceTerms.length > 0 ?
        <span>
          <RHFCheckbox name="hasAgreedToTerms" label={<>
            REQUIRED: For the health and safety of our staff and fellow guests, you and all members of your party understand and agree to:
            <ul>
              {serviceTerms.map((term, i) => <li key={i}>{term}</li>)}
            </ul>
          </>}
          />
        </span> : ""}
      <span className="service-date">
        <RHFDatePicker
          disabled={serviceNum === ""}
          name="serviceDate"
          label={serviceNum === "" ? "Select a requested service first" : "Service Date"}
          format={SERVICE_DATE_FORMAT}
          disableMaskedInput
          closeOnSelect
          disablePast
          placeholder={"Select Date"}
          maxDate={add(new Date(), { days: 60 })}
          shouldDisableDate={(e: Date) => OptionsForDate(e.valueOf()).length === 0}
        />
        { hasSelectedDateExpired ? <FormHelperText className="wpcf7-response-output wpcf7-mail-sent-ng" error>The previously selected service date has expired.</FormHelperText> : "" }
      </span>
      {serviceDate !== null ?
        <RHFSelect  className="service-time" name='serviceTime' label="Time" defaultValue="">
          {OptionsForDate(serviceDate).map((o, i) => <option key={i} disabled={o.disabled} value={o.value}>
            {o.value}
          </option>)}
        </RHFSelect> : ""}
        { hasSelectedTimeExpired ? <FormHelperText className="wpcf7-response-output wpcf7-mail-sent-ng" error>The previously selected service time has expired.</FormHelperText> : "" }
      {Number(serviceNum) === Number(DINEIN_SERVICE) ?
        (<span>
          <RHFSelect className="guest-count" name='dineInInfo.partySize' label="Party Size" >
            {[...Array(MAX_PARTY_SIZE)].map((_, i) => (<option key={i} value={i}>{i}</option>))}
          </RHFSelect>
        </span>) : ""
      }
      {Number(serviceNum) === DELIVERY_SERVICE ?
        <>
          <span className="flexbox" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && !orderCtrl.s.is_address_validated">
            <span className="flexbox__item one-whole">Delivery Information:</span>
          </span>
          <span className="flexbox" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && !orderCtrl.s.is_address_validated">
            <span className="flexbox__item one-half">
              <label htmlFor="address-line1">
                <span className="delivery-address-text">Address:</span>
              </label>
              <input type="text" name="address" id="address-line1" size={40} ng-model="orderCtrl.s.delivery_address" autoComplete="shipping address-line1" />
            </span>
            <span className="flexbox__item one-quarter soft-half--sides">
              <label htmlFor="address-line2">
                <span className="delivery-address-text">Apt/Unit:</span>
              </label>
              <input type="text" name="address-line2" size={10} id="address-line2" ng-model="orderCtrl.s.delivery_address_2" autoComplete="shipping address-line2" />
            </span>
            <span className="flexbox__item one-quarter">
              <label htmlFor="zipcode" >
                <span className="delivery-zipcode-text">Zip Code:</span>
              </label>
              <span className="zipcode">
                <input type="text" name="zipcode" id="zipcode" size={10} ng-model="orderCtrl.s.delivery_zipcode" autoComplete="postal-code" />
              </span>
            </span>
          </span>
          <span className="flexbox" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY">
            <span className="flexbox__item one-whole">
              <label htmlFor="delivery-instructions-text">
                <span className="delivery-instructions-text">Delivery Instructions (optional):</span>
              </label>
              <input type="text" id="delivery-instructions-text" name="delivery_instructions" size={40} ng-model="orderCtrl.s.delivery_instructions" ng-change="orderCtrl.ChangedEscapableInfo()" />
            </span>
          </span>
          <button type="submit" className="btn" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && !(stage1.address.$error.address || stage1.zipcode.$error.zipcode) && !orderCtrl.s.is_address_validated" ng-click="orderCtrl.ValidateDeliveryAddress()">Validate Delivery Address</button>
          <span ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && orderCtrl.s.validated_delivery_address" className="">
            <div className="wpcf7-response-output wpcf7-mail-sent-ok" ng-show="orderCtrl.s.is_address_validated">
              Found an address in our delivery area: <br />
              {/* <span className="title cart">{orderCtrl.s.validated_delivery_address} <button name="remove" ng-click="orderCtrl.ClearAddress()" className="button-remove">X</button></span> */}
            </div>
            {/* <div className="wpcf7-response-output wpcf7-mail-sent-ng" ng-show="!orderCtrl.s.is_address_validated">The address {orderCtrl.s.validated_delivery_address} isn't in our <Link target="_blank" href={DELIVERY_LINK}>delivery area</Link></div> */}
          </span>
          <div className="wpcf7-response-output wpcf7-mail-sent-ng" ng-show="orderCtrl.s.address_invalid">Unable to determine the specified address. Send us a text or email if you continue having issues.</div>
        </> : ""
      }
      {navComp(handleSubmit(() => onSubmitCallback()), !!isValid, false)}
    </FormProvider>
  </>);
}