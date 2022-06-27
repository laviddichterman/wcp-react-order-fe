import React, { useState, useCallback } from 'react';
import { TextField, Link, FormControl, RadioGroup, Radio, FormLabel, Checkbox, FormControlLabel } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { parse, isValid } from 'date-fns';
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { getTermsForService, StepData } from '../common';
import { useAppSelector } from '../../app/useHooks';
import { DELIVERY_LINK } from '../../config';
import * as yup from "yup";

const schema = yup.object().shape({
  serviceDate: yup
    .string()
    .test("serviceDate", "Enter a valid date", v => v !== undefined && isValid(parse(v, 'yyyy/MM/dd', new Date())))
    .required("Please select a service date")
});

export function WFulfillmentStageComponent() {
  const services = useAppSelector(s=>s.ws.services)
  const { handleSubmit, control } = useForm({
    resolver: yupResolver(schema)
  });
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const canSelectService = useCallback((service: number) => true, []);
  const updateSelectedService = (selection: number) => {
    setSelectedService(selection);
  };
  if (services === null) {
    return null;
  }
  const submitForm = (data : any) => {
    console.log(data);
  }

  return (<>
      <form
          noValidate
          onSubmit={handleSubmit(submitForm)}
          className="signup-form"
        >
    <FormControl>
      <FormLabel id="service-selection-radio-buttons-label">Requested Service:</FormLabel>
      <RadioGroup row aria-labelledby="service-selection-radio-buttons-label" value={selectedService} onChange={(_, value: string) => updateSelectedService(Number(value))}>
        {Object.values(services).map((serviceName: string, i: number) =>
          <FormControlLabel disabled={!canSelectService(i)} key={i} value={i} control={<Radio />} label={serviceName} />
        )}
      </RadioGroup>
    </FormControl>
    {getTermsForService(selectedService).length ?
      <span>
        <br />
        <FormControlLabel control={
          <><Checkbox value={hasAgreedToTerms} onChange={(e) => setHasAgreedToTerms(e.target.checked)} />

          </>} label={
            <>
              REQUIRED: For the health and safety of our staff and fellow guests, you and all members of your party understand and agree to:
              <ul>
                {getTermsForService(selectedService).map((term: string) => <li>{term}</li>)}
              </ul>
            </>
          } />
      </span> : ""}

    <label htmlFor="service-date">
      <span className="service-date-text">Date</span>
    </label>
    <span className="service-date">

    <Controller
              name="dateOfBirth"
              control={control}
              defaultValue={""}
              render={({
                field: { onChange, value },
                fieldState: { error, invalid }
              }) => (
    <DatePicker
      renderInput={(params) => (
        <TextField
          helperText={invalid && error ? error.message : null}
          id="dateOfBirth"
          variant="standard"
          margin="dense"
          fullWidth
          color="primary"
          autoComplete="bday"
          {...params}
          error={invalid} />
      )} 
      label="Service Date"
      value={value}
      onChange={(value) =>
        {
          console.log(value);
          return onChange(parse(value, "yyyy-MM-dd", new Date()));
        }
      }
      />
      )}
            />

      <input type="text" name="service-date" id="service-date" value="" size={40} ng-model="orderCtrl.s.date_string" ng-change="orderCtrl.ValidateDate()" required autoComplete="off" />
    </span>
    <label htmlFor="service-time">
      <span className="service-time-text">Time</span>
    </label>
    <span className="service-time">
      <select ng-disabled="!orderCtrl.s.date_valid" id="service-time" name="service-time" ng-model="orderCtrl.s.service_time" ng-options="servicetime | MinutesToPrintTime:orderCtrl.s.service_type for servicetime in orderCtrl.s.service_times" ng-change="orderCtrl.ServiceTimeChanged()" />
    </span>
    <div className="wpcf7-response-output wpcf7-mail-sent-ng" ng-if="orderCtrl.s.selected_time_timeout">The previously selected service time has expired.</div>
    <span ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN">
      <label htmlFor="guest-count">
        <span className="guest-count-text">Party Size</span>
      </label>
      <span className="guest-count">
        <select name="guest-count" id="guest-count" ng-model="orderCtrl.s.number_guests" ng-options="value for value in [] | Range:orderCtrl.CONFIG.MAX_PARTY_SIZE" ng-change="orderCtrl.fix_number_guests(false)" />
      </span>
    </span>
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
    <span ng-show="orderCtrl.s.service_type === orderCtrl.CONFIG.PICKUP && orderCtrl.CONFIG.ALLOW_SLICING">
      <br /><label><input type="checkbox" ng-model="orderCtrl.s.slice_pizzas" />
        Please slice my pizzas (not recommended)</label>
      <span ng-show="orderCtrl.s.slice_pizzas">Crust, like any good bread, should be given time to rest after baking. Slicing your pizzas as they come out of the oven also causes the trapped moisture at the top of the pizza to permiate the crust itself. If you do stick with this option, we'd recommend crisping up your slice on a hot skillet, as needed.</span>
    </span>
    <div className="order-nav">
      <button type="submit" className="btn" ng-disabled="!orderCtrl.s.date_valid || (orderCtrl.CONFIG.TERMS_LIST[orderCtrl.s.service_type].length > 0 && !orderCtrl.s.acknowledge_terms) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && (!orderCtrl.s.is_address_validated)) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN && (Number.isNaN(orderCtrl.s.number_guests) || orderCtrl.s.number_guests < 1 || orderCtrl.s.number_guests > orderCtrl.CONFIG.MAX_PARTY_SIZE))" ng-show="orderCtrl.HasNextStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage(); orderCtrl.ClearTimeoutFlag();">Next</button>
    </div>
    </form>
  </>);
}

WFulfillmentStageComponent.Stage = {
  title: "How and when would you like your order?",
  stepperTitle: "Timing",
  isComplete: () => false,
  content: <WFulfillmentStageComponent />
} as StepData