import React, { useState, useMemo } from 'react';
import { Typography, Link, Checkbox, FormControlLabel } from '@mui/material';

import { StoreCreditInputComponent } from '../StoreCreditInputComponent';
import { WCheckoutCart } from '../WCheckoutCart';
import { StepNav } from '../common';

import { SquarePaymentForm } from '../SquarePaymentForm';
import { TIP_PREAMBLE } from '../../config';
import { SelectServiceTimeDisplayString } from '../WFulfillmentSlice';
import { TipSelection } from '../WPaymentSlice';
import { useAppSelector } from '../../app/useHooks';

const TIP_SUGGESTION_15 : TipSelection = { value: 15, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_20 : TipSelection = { value: 20, isSuggestion: true, isPercentage: true };
// const TIP_SUGGESTION_225 = new TipSelection(true, true, 225);
const TIP_SUGGESTION_25 : TipSelection = { value: 25, isSuggestion: true, isPercentage: true };
// const TIP_SUGGESTION_30 = new TipSelection(true, true, 30);

export function WCheckoutStage({ navComp } : { navComp : StepNav }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const serviceTimeDisplayString = useAppSelector(s=>SelectServiceTimeDisplayString(s.fulfillment));
  const [selected_time_timeout, setSelectedTimeTimeout] = useState(false);
  const tipBasis = 0; //useMemo(() => totals.computed_subtotal + totals.deliveryFee + totals.computed_tax, [totals.computed_subtotal, totals.deliveryFee, totals.computed_tax]);
  const [tipUiDirty, setTipUiDirty] = useState(false);
  const [autogratEnabled, setAutogratEnabled] = useState(false);
  const tipSuggestionsArray = useMemo(() => [TIP_SUGGESTION_15, TIP_SUGGESTION_20, TIP_SUGGESTION_25], []);
  const [customTip, setCustomTip] = useState<TipSelection>({ isPercentage: false, isSuggestion: false, value: (totals.computed_subtotal + totals.deliveryFee + totals.computed_tax) * TIP_SUGGESTION_20.value } );
  const [currentTipSelection, setCurrentTipSelection] = useState<TipSelection | null>(TIP_SUGGESTION_20);
  const [isCustomTipSelected, setIsCustomTipSelected] = useState(false);
  const [storeCreditCode, setStoreCreditCode] = useState("");
  const [orderSubmissionResponse, setOrderSubmissionResponse] = useState({ successful: true, squarePayment: {money_charged: 2342, last4: 1234, receipt_url: ""} });
  const creditResponse = undefined;
  const setAndSubmitStoreCreditIfAble = (value: string) => {
    if (creditResponse && !creditResponse.validation_processing) {
      // if complete credit code format
    }
    else {
      setStoreCreditCode(value);
    }
  }
  const setCreditResponse = (response: any) => {

  }
  const submitNoBalanceDue = () => {

  }
  const submitWithSquare = () => {
    setIsProcessing(true);
    // setOrderSubmissionResponse({});
  }
  const [useCreditCheckbox, setUseCreditCheckbox] = useState(false);
  
  
  const setSuggestedTipHandler = (tip: TipSelection) => {
    setTipUiDirty(true);
    setCurrentTipSelection(tip);
    const newTipCashValue = tip.computeCashValue(tipBasis);
    if (customTip.computeCashValue(tipBasis) < newTipCashValue) {
      setCustomTip(new TipSelection(false, false, newTipCashValue));
    }
  }
  const setCustomTipHandler = (value: string, correctInvalid: boolean) => {
    if (autogratEnabled) {

    } else {

    }
  }
  if (!isProcessing) {
    if (!orderSubmissionResponse) {
      return (
        <div>
          <h3 className="flush--top">Add gratuity to your order and settle up!</h3>
          <h5>{TIP_PREAMBLE}</h5>
          <div className="flexbox">
            {tipSuggestionsArray.map((tip: TipSelection, i: number) =>
              <div className="flexbox__item one-third soft-quarter">
                <button onClick={() => { setTipUiDirty(true); setCurrentTipSelection(tip) }} className={`btn tipbtn flexbox__item one-whole${currentTipSelection === tip ? ' selected' : ''}`} >
                  <h3 className="flush--bottom">{fPercent(tip.value)}</h3>
                  <h5 className="flush--top">{fCurrency(tip.computeCashValue(tipBasis))}</h5>
                </button>
              </div>
            )}
          </div>
          <div className="flexbox">
            <div className="flexbox__item one-third soft-quarter" >
              <button onClick={() => setIsCustomTipSelected(true)} className={`btn tipbtn flexbox__item one-whole${isCustomTipSelected ? " selected" : ""}`} >
                <h3 className="flush">Custom Tip Amount</h3>
                {isCustomTipSelected ? <input value={customTip.value} onChange={(e) => setCustomTipHandler(e.target.value, false)} onBlur={(e) => setCustomTipHandler(e.target.value, true)} type="number" className="quantity" min={0} /> : ""}
              </button>
            </div>
          </div>
          <WCheckoutCart/>
          {selected_time_timeout ? <div className="wpcf7-response-output wpcf7-mail-sent-ng">The previously selected service time has expired. We've updated your service time to {serviceTimeDisplayString}.</div> : ""}
          {creditResponse && creditResponse.validation_fail ? <div className="wpcf7-response-output wpcf7-mail-sent-ng">Code entered looks to be invalid. Please check your input and try again. Please copy/paste from the e-mail you received. Credit codes are case sensitive.</div> : ""}
          <div className="flexbox">
            <h4 className="flexbox__item one-whole">Payment Information:</h4>
          </div>
          <div className="soft-half">
            <div className="flexbox">
              <FormControlLabel
                className='flexbox__item'
                control={<Checkbox checked={useCreditCheckbox} onChange={(e) => setUseCreditCheckbox(e.target.checked)} />}
                label="Use Digital Gift Card / Store Credit"
              />
            </div>
            {useCreditCheckbox ?
              <div className="flexbox">
                <div className="flexbox__item one-tenth"><label htmlFor="store_credit_code">Code:</label></div>
                <div className="flexbox__item soft-half--left three-quarters">
                  <span className="float--right">
                    <StoreCreditInputComponent disabled={creditResponse && (creditResponse.validation_successful || creditResponse.validation_processing)} size="20" value={storeCreditCode} onChange={(e) => setAndSubmitStoreCreditIfAble(e.target.value)} />
                  </span>
                </div>
                <div className="flexbox__item soft-half--left">
                  <span className={creditResponse?.validation_successful ? "icon-check-circle" : (creditResponse?.validation_fail ? "icon-exclamation-circle" : "")} />
                </div>
              </div> : ""}
          </div>
          <div>
            {totals.balance === 0 ? "" : <SquarePaymentForm />}
            <div>Note: Once orders are submitted, they are non-refundable. We will attempt to make any changes requested, but please do your due diligence to check the order for correctness!</div>
            {navComp(() => {return}, isProcessing , true)}
            <div className="order-nav" ng-show="orderCtrl.s.stage === 6">
              <button type="submit" className="btn" disabled={isProcessing} ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
              <button ng-show="orderCtrl.s.balance > 0" id="sq-creditcard" className="btn" ng-click="orderCtrl.ScrollTop(); submitForm()" ng-disabled="orderCtrl.s.isProcessing">Pay and submit order!</button>
              <button ng-show="orderCtrl.s.balance == 0" className="btn" ng-click="orderCtrl.ScrollTop(); orderCtrl.SubmitToWario()" ng-disabled="orderCtrl.s.isProcessing">Pay and submit order!</button>
            </div>
            <div ng-hide="orderCtrl.s.tip_value === 0">* Gratuity is distributed in its entirety to front and back of house.</div>
          </div>
        </div>);
    }
    else {
      // case: we've got an orderSubmissionResponse and it's done processing, show the results
      if (orderSubmissionResponse.successful) {
        return <div>
          <div className="submitsuccess wpcf7-response-output wpcf7-mail-sent-ok">Order submitted successfully! Please check your email.</div>
          {orderSubmissionResponse.squarePayment ? <div>
            Payment of ${fCurrency(orderSubmissionResponse.squarePayment.money_charged / 100)} received from card ending in: {orderSubmissionResponse.squarePayment.last4}!
            Here's your <Link href={orderSubmissionResponse.squarePayment.receipt_url} target="_blank" rel="noopener">receipt</Link>.
          </div> : ""}
          {creditResponse?.validation_successful && creditResponse.amount_used > 0 ? (<div>
            Digital Gift Card number {creditResponse.code} debited ${fCurrency(creditResponse.amount_used)}.
            <span>{creditResponse.amount_used === creditResponse.amount ? "No balance remains." : `Balance of ${fCurrency(creditResponse.amount - creditResponse.amount_used)} remains.`}</span>
          </div>) : ""}
        </div>
      }
      else {
        return (
          <div>
            <div className="wpcf7-response-output wpcf7-validation-errors" >We had some issues processing your order. Please send us a text message or email so we can look into it.</div>
          </div>);
      }
    }
  }
  // case: it's processing... show that we're waiting on the results
  return (<div className="wpcf7 wpcf7-response-output wpcf7-mail-sent-ok">
    <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Tell us a little about you.</Typography>
    Submitting order! This can take a few seconds.<span className="ajax-loader"></span>
  </div>);
}