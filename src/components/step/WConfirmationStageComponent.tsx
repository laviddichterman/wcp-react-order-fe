import React, { useState, useMemo } from 'react';
import { Typography, Link, Checkbox, FormControlLabel, Input, Button } from '@mui/material';

import { WCheckoutCart } from '../WCheckoutCart';
import { StepNav } from '../common';


import { TIP_PREAMBLE } from '../../config';
import { SelectServiceTimeDisplayString } from '../../app/slices/WFulfillmentSlice';
import { TipSelection, ComputeTipValue, setTip } from '../../app/slices/WPaymentSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { fCurrency, fPercent } from '../../utils/numbers';
import { SelectAutoGratutityEnabled, SelectBalanceAfterCredits, SelectTipBasis } from '../../app/store';
import { StoreCreditSection } from '../StoreCreditSection';
import { CreditCard, GooglePay, ApplePay } from 'react-square-web-payments-sdk';
import { useEffect } from 'react';

const TIP_SUGGESTION_15: TipSelection = { value: .15, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_20: TipSelection = { value: .2, isSuggestion: true, isPercentage: true };
// const TIP_SUGGESTION_225 = new TipSelection(true, true, 225);
const TIP_SUGGESTION_25: TipSelection = { value: .25, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_30: TipSelection = { value: .3, isSuggestion: true, isPercentage: true };

const TIP_SUGGESTIONS = [TIP_SUGGESTION_15, TIP_SUGGESTION_20, TIP_SUGGESTION_25, TIP_SUGGESTION_30];

export function WConfirmationStageComponent({ navComp }: { navComp: StepNav }) {

      // // case: we've got an orderSubmissionResponse and it's done processing, show the results
      
      //   return <div>
      //     <div className="submitsuccess wpcf7-response-output wpcf7-mail-sent-ok">Order submitted successfully! Please check your email.</div>
      //     {orderSubmissionResponse.squarePayment ? <div>
      //       Payment of ${fCurrency(orderSubmissionResponse.squarePayment.money_charged / 100)} received from card ending in: {orderSubmissionResponse.squarePayment.last4}!
      //       Here's your <Link href={orderSubmissionResponse.squarePayment.receipt_url} target="_blank" rel="noopener">receipt</Link>.
      //     </div> : ""}
      //     {creditResponse?.validation_successful && creditResponse.amount_used > 0 ? (<div>
      //       Digital Gift Card number {creditResponse.code} debited ${fCurrency(creditResponse.amount_used)}.
      //       <span>{creditResponse.amount_used === creditResponse.amount ? "No balance remains." : `Balance of ${fCurrency(creditResponse.amount - creditResponse.amount_used)} remains.`}</span>
      //     </div>) : ""}
      //   </div>
      // }
      // else {
        return (
          <div>
            <div className="wpcf7-response-output wpcf7-validation-errors" >We had some issues processing your order. Please send us a text message or email so we can look into it.</div>
          </div>);
      }
  
//}