import React, { useState, useMemo } from 'react';
import { Typography, Input, Button } from '@mui/material';

import { WCheckoutCart } from '../WCheckoutCart';
import { StepNav } from '../common';


import { TIP_PREAMBLE } from '../../config';
import { SelectServiceTimeDisplayString } from '../WFulfillmentSlice';
import { TipSelection, ComputeTipValue, setTip } from '../WPaymentSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { fCurrency, fPercent } from '../../utils/numbers';
import { SelectAutoGratutityEnabled, SelectBalanceAfterCredits, SelectTipBasis } from '../../app/store';
import { StoreCreditSection } from '../StoreCreditSection';
import { CreditCard } from 'react-square-web-payments-sdk';
import { useEffect } from 'react';

const TIP_SUGGESTION_15: TipSelection = { value: .15, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_20: TipSelection = { value: .2, isSuggestion: true, isPercentage: true };
// const TIP_SUGGESTION_225 = new TipSelection(true, true, 225);
const TIP_SUGGESTION_25: TipSelection = { value: .25, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_30: TipSelection = { value: .3, isSuggestion: true, isPercentage: true };

const TIP_SUGGESTIONS = [TIP_SUGGESTION_15, TIP_SUGGESTION_20, TIP_SUGGESTION_25, TIP_SUGGESTION_30];

export function WCheckoutStage({ navComp }: { navComp: StepNav }) {
  const dispatch = useAppDispatch();
  const [isProcessing, setIsProcessing] = useState(false);
  const serviceTimeDisplayString = useAppSelector(s => SelectServiceTimeDisplayString(s.fulfillment));
  const hasSelectedTimeExpired = useAppSelector(s => s.fulfillment.hasSelectedDateExpired);
  const tipBasis = useAppSelector(SelectTipBasis);
  const balance = useAppSelector(SelectBalanceAfterCredits);
  const squarePayment = useAppSelector(s => s.payment.squarePayment);
  const autogratEnabled = useAppSelector(SelectAutoGratutityEnabled);
  const tipSuggestionsArray = useMemo(() => TIP_SUGGESTIONS.slice(autogratEnabled ? 1 : 0, autogratEnabled ? TIP_SUGGESTIONS.length : TIP_SUGGESTIONS.length-1), [autogratEnabled]);
  const currentTipSelection = useAppSelector(s=>s.payment.selectedTip);
  const [isCustomTipSelected, setIsCustomTipSelected] = useState(currentTipSelection?.isSuggestion === false || false);
  const [customTipAmount, setCustomTipAmount] = useState(ComputeTipValue(currentTipSelection || TIP_SUGGESTION_20, tipBasis).toFixed(2));
  const [orderSubmissionResponse, setOrderSubmissionResponse] = useState(null);//{ successful: true, squarePayment: {money_charged: 2342, last4: 1234, receipt_url: ""} });
  useEffect(() => {
    if (currentTipSelection === null) {
      dispatch(setTip(TIP_SUGGESTION_20));
    }
  }, [currentTipSelection, dispatch])

  const onChangeSelectedTip = (tip : TipSelection) => { 
    dispatch(setTip(tip));
  }
  const submitNoBalanceDue = () => {

  }
  const submitWithSquare = () => {
    setIsProcessing(true);
    // setOrderSubmissionResponse({});
  }

  const resetCustomTip = () => {
    const resetValue = ComputeTipValue(TIP_SUGGESTION_20, tipBasis);
    setCustomTipAmount(resetValue.toFixed(2));
    dispatch(setTip({value: resetValue, isPercentage: false, isSuggestion: false}));
  }

  const setCustomTipAmountIntercept = (value : string) => {
    setIsCustomTipSelected(true);
    // setTipUiDirty(true);
    const parsedValue = parseFloat(value);
    if (!isFinite(parsedValue) || !isNaN(parsedValue) || parsedValue < 0) {
      resetCustomTip()
    }
    setCustomTipAmount(value);
    dispatch(setTip({value: parsedValue, isPercentage: false, isSuggestion: false}));
  }

  const onSelectSuggestedTip = (tip : TipSelection) => { 
    // setTipUiDirty(true);
    setIsCustomTipSelected(false);
    onChangeSelectedTip(tip);
    const newTipCashValue = ComputeTipValue(tip, tipBasis);
    if (parseFloat(customTipAmount) < newTipCashValue) {
      setCustomTipAmount(newTipCashValue.toFixed(2));
    }
  }

  const setCustomTipHandler = (value: string) => {
    const numericValue = parseFloat(value);
    if (autogratEnabled || numericValue < 0) {
      resetCustomTip();
    } else {
      setCustomTipAmount(numericValue.toFixed(2));
      dispatch(setTip({value: numericValue, isPercentage: false, isSuggestion: false}));
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
                <Button onClick={() => onSelectSuggestedTip(tip)} className={`btn tipbtn flexbox__item one-whole${currentTipSelection === tip ? ' selected' : ''}`} >
                  <h3 className="flush--bottom">{fPercent(tip.value)}</h3>
                  <h5 className="flush--top">{fCurrency(ComputeTipValue(tip, tipBasis))}</h5>
                </Button>
              </div>
            )}
          </div>
          <div className="flexbox">
            <div className="flexbox__item one-third soft-quarter" >
              <button onClick={() => setCustomTipAmountIntercept(customTipAmount)} className={`btn tipbtn flexbox__item one-whole${isCustomTipSelected ? " selected" : ""}`} >
                <h3 className="flush">Custom Tip Amount</h3>
                {isCustomTipSelected ? <Input value={customTipAmount} onChange={(e) => setCustomTipAmountIntercept(e.target.value)} onBlur={(e) => setCustomTipHandler(e.target.value)} type="number" className="quantity" inputProps={{min: 0}} /> : ""}
              </button>
            </div>
          </div>
          <WCheckoutCart />
          {hasSelectedTimeExpired ? <div className="wpcf7-response-output wpcf7-mail-sent-ng">The previously selected service time has expired. We've updated your service time to {serviceTimeDisplayString}.</div> : ""}
          <div className="flexbox">
            <h4 className="flexbox__item one-whole">Payment Information:</h4>
          </div>
          <StoreCreditSection />
          <div>
            {balance > 0 && <>
              <CreditCard />
              {/* <GooglePay />
              <ApplePay /> */}
            </>}
            <div>Note: Once orders are submitted, they are non-refundable. We will attempt to make any changes requested, but please do your due diligence to check the order for correctness!</div>
            {navComp(() => { return }, isProcessing, true)}
          </div>
        </div>);
    }
  }
  // case: it's processing... show that we're waiting on the results
  return (<div className="wpcf7 wpcf7-response-output wpcf7-mail-sent-ok">
    <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Tell us a little about you.</Typography>
    Submitting order! This can take a few seconds.<span className="ajax-loader"></span>
  </div>);
}