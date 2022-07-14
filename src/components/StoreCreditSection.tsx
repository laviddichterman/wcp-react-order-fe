import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { FormControlLabel, Checkbox } from '@mui/material';
import { StoreCreditInputComponent } from './StoreCreditInputComponent';
import { useState } from 'react';
import { Done, Error } from '@mui/icons-material';
import {CREDIT_REGEX} from '@wcp/wcpshared';
import { validateStoreCredit } from './WPaymentSlice';



export function StoreCreditSection() {
  const dispatch = useAppDispatch();
  const [useCreditCheckbox, setUseCreditCheckbox] = useState(false);
  const creditValidationLoading = useAppSelector(s => s.payment.creditValidationLoading);
  const storeCreditInput = useAppSelector(s => s.payment.storeCreditInput);
  const [ localCreditCode, setLocalCreditCode ] = useState(storeCreditInput);
  console.log(localCreditCode);
  const setLocalCreditCodeAndAttemptToValidate = function(code : string) {
    setLocalCreditCode(code);
    if (creditValidationLoading !== 'PENDING' && code.length === 19 && CREDIT_REGEX.test(code)) {
      dispatch(validateStoreCredit(code))
    }
  }
  return (


    <div className="soft-half">
      {localCreditCode}
      <div className="flexbox">
        <FormControlLabel
          className='flexbox__item'
          control={<Checkbox checked={useCreditCheckbox} onChange={(e) => setUseCreditCheckbox(e.target.checked)} />}
          label="Use Digital Gift Card / Store Credit"
        />
      </div>
      {useCreditCheckbox &&
        <div className="flexbox">
            <span className="float--right">
              <StoreCreditInputComponent name="Credit Code" label="Code:" id="store_credit_code" disabled={creditValidationLoading === 'SUCCEEDED' || creditValidationLoading === 'PENDING'} value={localCreditCode} onChange={(e) => setLocalCreditCodeAndAttemptToValidate(e.target.value)} />
            </span>
          <div className="flexbox__item soft-half--left">
          { creditValidationLoading === "FAILED" && <Error />}
          { creditValidationLoading === "SUCCEEDED" && <Done />}
          </div>
        </div>}
        { creditValidationLoading === "FAILED" && <div className="wpcf7-response-output wpcf7-mail-sent-ng">Code entered looks to be invalid. Please check your input and try again. Please copy/paste from the e-mail you received. Credit codes are case sensitive.</div>}
    </div>
  )
}