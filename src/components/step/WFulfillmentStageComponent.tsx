import React, { useCallback, useMemo, useEffect } from 'react';
import { Typography } from '@mui/material';

import { isValid as isDateValid, add } from 'date-fns';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getTermsForService, MAX_PARTY_SIZE, StepNav, SERVICE_DATE_FORMAT } from '../common';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { FormProvider, RHFCheckbox, RHFRadioGroup, RHFDatePicker, RHFSelect } from '../hook-form';
import { DELIVERY_LINK, DELIVERY_SERVICE, DINEIN_SERVICE } from '../../config';
import * as yup from "yup";
import { IWSettings, JSFEBlockedOff, ServicesEnableMap, WDateUtils } from '@wcp/wcpshared';
import { FulfillmentSchema, fulfillmentSchemaInstance, setFulfillment } from '../WFulfillmentSlice';

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
  const AvailabilityInfoMapForServicesAndDate = useCallback((selectedDate: Date, serviceSelection: ServicesEnableMap, cartInfo: CartInfoToDepricate) =>
    WDateUtils.GetInfoMapForAvailabilityComputation(blockedOff, settings, leadtimes, selectedDate, serviceSelection, cartInfo), [settings, leadtimes, blockedOff]);
  const OptionsForServicesAndDate = useCallback((selectedDate: Date, serviceSelection: ServicesEnableMap, cartInfo: CartInfoToDepricate) => {
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

function useFulfillmentForm(availability: ReturnType<typeof useAvailabilityHook>) {

  const useFormApi = useForm<FulfillmentSchema>({

//  seems to be a bug here where this cannot be set?
    defaultValues: {
      // serviceNum: 0,
      // deliveryInfo: null,
      // dineInInfo: null,
      // hasAgreedToTerms: false,
      // serviceDate: new Date(),
      // serviceTime: 0
    },
    resolver: yupResolver(fulfillmentSchemaInstance),
    mode: "onChange",

  });

  return useFormApi;
}

export function WFulfillmentStageComponent({ navComp } : { navComp : StepNav }) {
  const dispatch = useAppDispatch();
  const availability = useAvailabilityHook();
  const { services, HasOperatingHoursForService, OptionsForServicesAndDate } = availability;
  const fulfillmentForm = useFulfillmentForm(availability);
  const { watch, getValues, formState: {errors, isSubmitting, isDirty, isValid}, handleSubmit } = fulfillmentForm;
  const values = watch();
  const { serviceNum, serviceDate } = values;
  const serviceTerms = useMemo(() => {
    const num = parseInt(serviceNum, 10);
    return Number.isInteger(num) ? getTermsForService(parseInt(serviceNum, 10)) : [];}, [serviceNum]);
  const OptionsForDate = useCallback((d: Date) => {
    if (serviceNum === "" || !isDateValid(d)) {
      return [];
    }
    const serviceSelectionMap: { [index: string]: boolean } = {};
    serviceSelectionMap[String(serviceNum)] = true;
    return OptionsForServicesAndDate(d, serviceSelectionMap, { size: 0, cart_based_lead_time: 0 });
  }, [OptionsForServicesAndDate, serviceNum])
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

    dispatch(setFulfillment(getValues()))
  };
  if (services === null || ServiceOptions.length === 0) {
    return null;
  }
console.log(isValid);
console.log(errors);

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
          shouldDisableDate={(e: Date) => OptionsForDate(e).length === 0}
        />
      </span>

      {serviceDate !== null ?
        <RHFSelect className="service-time" name='serviceTime' label="Time">
          {OptionsForDate(serviceDate).map((o, i) => <option key={i} disabled={o.disabled} value={o.value}>
            {o.value}
          </option>)}
        </RHFSelect> : ""}
      <div className="wpcf7-response-output wpcf7-mail-sent-ng" ng-if="orderCtrl.s.selected_time_timeout">The previously selected service time has expired.</div>
      {Number(serviceNum) === Number(DINEIN_SERVICE) ?
        (<span>
          <RHFSelect className="guest-count" name='dineInInfo.partySize' label="Party Size" >
            {[...Array(MAX_PARTY_SIZE)].map((_, i) => (<option key={i} value={i}>{i}</option>))}
          </RHFSelect>
        </span>) : ""
      }
      {Number(values.serviceNum) === DELIVERY_SERVICE ?
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
      {navComp(handleSubmit(() => onSubmitCallback()), !!isValid , false)}
    </FormProvider>
  </>);
}