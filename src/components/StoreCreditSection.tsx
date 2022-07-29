import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { FormControlLabel, Checkbox, Grid } from '@mui/material';
import { StoreCreditInputComponent } from './StoreCreditInputComponent';
import { useState } from 'react';
import { Done, Error } from '@mui/icons-material';
import { CREDIT_REGEX } from '@wcp/wcpshared';
import { validateStoreCredit, clearCreditCode } from '../app/slices/WPaymentSlice';
import { ErrorResponseOutput } from './styled/styled';



export function StoreCreditSection() {
  const dispatch = useAppDispatch();
  const [useCreditCheckbox, setUseCreditCheckbox] = useState(false);
  const creditValidationLoading = useAppSelector(s => s.payment.creditValidationLoading);
  const storeCreditInput = useAppSelector(s => s.payment.storeCreditInput);
  const [localCreditCode, setLocalCreditCode] = useState(storeCreditInput);
  const setLocalCreditCodeAndAttemptToValidate = function (code: string) {
    setLocalCreditCode(code);
    if (creditValidationLoading !== 'PENDING' && code.length === 19 && CREDIT_REGEX.test(code)) {
      dispatch(validateStoreCredit(code))
    }
  }
  const handleSetUseCreditCheckbox = (checked: boolean) => {
    if (!checked) {
      dispatch(clearCreditCode());
      setLocalCreditCode("");
    }
    setUseCreditCheckbox(checked);
  }
  return (
    <Grid container alignContent={'center'}>
      <Grid sx={{pt:2}} item md={useCreditCheckbox ? 6 : 12} xs={12}>
        <FormControlLabel
          control={<Checkbox checked={useCreditCheckbox} onChange={(e) => handleSetUseCreditCheckbox(e.target.checked)} />}
          label="Use Digital Gift Card / Store Credit"
        />
      </Grid>
      {useCreditCheckbox &&
        <Grid sx={{pl:2, justifyContent: 'flex-end'}} item xs={12} lg={6} container >
          <Grid item xs={10} sx={{width: '100%'}}>
          <StoreCreditInputComponent
            autoFocus
            name="Credit Code"
            label="Code:"
            id="store_credit_code"
            disabled={creditValidationLoading === 'SUCCEEDED' || creditValidationLoading === 'PENDING'}
            value={localCreditCode}
            onChange={(e) => setLocalCreditCodeAndAttemptToValidate(e.target.value)}
          />
          </Grid>
          <Grid item xs={1} sx={{p:2}}>
          {creditValidationLoading === "FAILED" && <Error />}
          {creditValidationLoading === "SUCCEEDED" && <Done />}
          </Grid>
        </Grid>}

      {creditValidationLoading === "FAILED" && 
        <Grid item xs={12}>
          <ErrorResponseOutput>Code entered looks to be invalid. Please check your input and try again. Please copy/paste from the e-mail you received. Credit codes are case sensitive.</ErrorResponseOutput>
        </Grid>}
    </Grid>
  )
}