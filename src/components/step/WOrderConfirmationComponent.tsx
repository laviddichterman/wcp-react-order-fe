import React, { useState, useMemo } from 'react';
import { Typography, Link, Checkbox, FormControlLabel } from '@mui/material';

import { useAppSelector } from '../../app/useHooks';
import { StepNav } from '../common';


export function WOrderConfirmation({ navComp } : { navComp : StepNav }) {
        return <div>
          {/* <div className="submitsuccess wpcf7-response-output wpcf7-mail-sent-ok">Order submitted successfully! Please check your email.</div>
          {orderSubmissionResponse.squarePayment ? <div>
            Payment of ${fCurrency(orderSubmissionResponse.squarePayment.money_charged / 100)} received from card ending in: {orderSubmissionResponse.squarePayment.last4}!
            Here's your <Link href={orderSubmissionResponse.squarePayment.receipt_url} target="_blank" rel="noopener">receipt</Link>.
          </div> : ""}
          {creditResponse?.validation_successful && creditResponse.amount_used > 0 ? (<div>
            Digital Gift Card number {creditResponse.code} debited ${fCurrency(creditResponse.amount_used)}.
            <span>{creditResponse.amount_used === creditResponse.amount ? "No balance remains." : `Balance of ${fCurrency(creditResponse.amount - creditResponse.amount_used)} remains.`}</span>
          </div>) : ""} */}
        </div>

}