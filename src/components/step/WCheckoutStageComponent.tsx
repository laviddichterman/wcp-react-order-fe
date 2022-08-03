import { useState, useMemo } from 'react';
import { Box, Typography, Grid, Input, Link } from '@mui/material';

import { WCheckoutCart } from '../WCheckoutCart';
import { TIP_PREAMBLE } from '../../config';
import { setTip, submitToWario } from '../../app/slices/WPaymentSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { fCurrency, fCurrencyNoUnit } from '../../utils/numbers';
import { SelectAmountCreditUsed, SelectAutoGratutityEnabled, SelectBalanceAfterCredits, SelectTipBasis } from '../../app/store';
import { StoreCreditSection } from '../StoreCreditSection';
import { CreditCard, ApplePay } from 'react-square-web-payments-sdk';
import { useEffect } from 'react';
import { backStage } from '../../app/slices/StepperSlice';
import { Navigation } from '../Navigation';
import { TipSelection, ComputeTipValue } from '@wcp/wcpshared';
import LoadingScreen from '../LoadingScreen';
import { ErrorResponseOutput, Separator, SquareButtonCSS, StageTitle, WarioButton, WarioToggleButton } from '../styled/styled';

const TIP_SUGGESTION_15: TipSelection = { value: .15, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_20: TipSelection = { value: .2, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_25: TipSelection = { value: .25, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_30: TipSelection = { value: .3, isSuggestion: true, isPercentage: true };

const TIP_SUGGESTIONS = [TIP_SUGGESTION_15, TIP_SUGGESTION_20, TIP_SUGGESTION_25, TIP_SUGGESTION_30];

export function WCheckoutStage() {
  const dispatch = useAppDispatch();
  const tipBasis = useAppSelector(SelectTipBasis);
  const balance = useAppSelector(SelectBalanceAfterCredits);
  const creditApplied = useAppSelector(SelectAmountCreditUsed);
  const storeCreditValidation = useAppSelector(s => s.payment.storeCreditValidation);
  const storeCreditCode = useAppSelector(s => s.payment.storeCreditInput);
  const submitToWarioResponse = useAppSelector(s => s.payment.warioResponse);

  const submitToWarioStatus = useAppSelector(s => s.payment.submitToWarioStatus);
  const specialInstructions = useAppSelector(s => s.payment.specialInstructions);
  const autogratEnabled = useAppSelector(SelectAutoGratutityEnabled);
  const tipSuggestionsArray = useMemo(() => TIP_SUGGESTIONS.slice(autogratEnabled ? 1 : 0, autogratEnabled ? TIP_SUGGESTIONS.length : TIP_SUGGESTIONS.length - 1), [autogratEnabled]);
  const currentTipSelection = useAppSelector(s => s.payment.selectedTip);
  const [isCustomTipSelected, setIsCustomTipSelected] = useState(currentTipSelection?.isSuggestion === false || false);
  const [customTipAmount, setCustomTipAmount] = useState(ComputeTipValue(currentTipSelection || TIP_SUGGESTION_20, tipBasis).toFixed(2));
  const squareTokenErrors = useAppSelector(s => s.payment.squareTokenErrors);
  const orderSubmitErrors = useAppSelector(s => s.payment.orderSubmitErrors);
  useEffect(() => {
    if (currentTipSelection === null) {
      dispatch(setTip(TIP_SUGGESTION_20));
    }
  }, [currentTipSelection, dispatch])

  const onChangeSelectedTip = (tip: TipSelection) => {
    dispatch(setTip(tip));
  }
  const submitNoBalanceDue = () => {
    dispatch(submitToWario())
  }

  const resetCustomTip = () => {
    const resetValue = ComputeTipValue(TIP_SUGGESTION_20, tipBasis);
    setCustomTipAmount(resetValue.toFixed(2));
    dispatch(setTip({ value: resetValue, isPercentage: false, isSuggestion: false }));
  }

  const setCustomTipAmountIntercept = (value: string) => {
    setIsCustomTipSelected(true);
    const parsedValue = parseFloat(value);
    if (!isFinite(parsedValue) || !isNaN(parsedValue) || parsedValue < 0) {
      resetCustomTip()
    }
    setCustomTipAmount(value);
    dispatch(setTip({ value: parsedValue, isPercentage: false, isSuggestion: false }));
  }

  const onSelectSuggestedTip = (tip: TipSelection) => {
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
      dispatch(setTip({ value: numericValue, isPercentage: false, isSuggestion: false }));
    }
  }
  return submitToWarioStatus !== 'SUCCEEDED' ?
    <Box>
      {submitToWarioStatus === 'PENDING' && <LoadingScreen />}
      <StageTitle>Add gratuity to your order and settle up!</StageTitle>
      <Separator sx={{ pb: 3 }} />
      <Typography variant='body1'>{TIP_PREAMBLE}</Typography>
      <Grid container sx={{ py: 2 }}>
        {tipSuggestionsArray.map((tip: TipSelection, i: number) =>
          <Grid key={i} item xs={4} sx={{ px: 0.5 }} >
            <WarioToggleButton selected={currentTipSelection === tip} sx={{ display: 'table-cell' }} value={tip} fullWidth onClick={() => onSelectSuggestedTip(tip)} >
              <Grid container sx={{ py: 2 }}>
                <Grid item xs={12}><Typography sx={{ color: 'white' }} variant='h4'>{(tip.value * 100)}%</Typography></Grid>
                <Grid item xs={12}><Typography sx={{ color: 'white' }} variant='subtitle2'>{fCurrencyNoUnit(ComputeTipValue(tip, tipBasis))}</Typography></Grid>
              </Grid>
            </WarioToggleButton>
          </Grid>
        )}
        <Grid item sx={{ px: 0.5, pt: 1 }} xs={12}>
          <WarioToggleButton selected={isCustomTipSelected} fullWidth value={customTipAmount} onClick={() => setCustomTipAmountIntercept(customTipAmount)} >
            <Grid container>
              <Grid item xs={12}>
                <Typography variant='h4' sx={{ color: 'white' }}>Custom Tip Amount</Typography>
              </Grid>
              <Grid item xs={12} sx={{ height: '2.5em' }}>
                {isCustomTipSelected ?
                  <Input
                    value={customTipAmount}
                    onChange={(e) => setCustomTipAmountIntercept(e.target.value)}
                    onBlur={(e) => setCustomTipHandler(e.target.value)}
                    type="number"
                    inputProps={{ min: 0, sx: { textAlign: 'center', color: 'white' } }}
                  /> : " "}
              </Grid>
            </Grid>
          </WarioToggleButton>
        </Grid>
      </Grid>
      <WCheckoutCart />
      <Box>
        <StageTitle>Payment Information:</StageTitle>
        <Grid container>
          <Grid item container xs={12} sx={{ px: 2, pb: 4 }}><StoreCreditSection /></Grid>
          <Grid item xs={12}>
            {balance > 0 ? // && (specialInstructions === null || specialInstructions.length < 50) ?
              <>
                <CreditCard
                  // @ts-ignore 
                  focus={""}
                  buttonProps={{
                    isLoading: submitToWarioStatus === 'PENDING', css: SquareButtonCSS
                  }}>
                  Submit Order
                </CreditCard>
                {/* <ApplePay>Pay with Apple Pay</ApplePay> */}
                {/* <GooglePay /> */}
              </> :
              <WarioButton disabled={submitToWarioStatus === 'PENDING'} fullWidth onClick={() => submitNoBalanceDue()} >Submit Order</WarioButton>}
            {squareTokenErrors.length > 0 &&
              squareTokenErrors.map((e, i) => <Grid item xs={12} key={i}><ErrorResponseOutput key={`${i}tokenerrors`}>{e.message}</ErrorResponseOutput></Grid>)}
            {orderSubmitErrors.length > 0 &&
              orderSubmitErrors.map((e, i) => <Grid item xs={12} key={i}><ErrorResponseOutput key={`${i}payment`}>{e}</ErrorResponseOutput></Grid>)}
            <div>Note: Once orders are submitted, they are non-refundable. We will attempt to make any changes requested, but please do your due diligence to check the order for correctness!</div>
          </Grid>
        </Grid>
        <Navigation canBack={submitToWarioStatus !== 'PENDING'} hasNext={false} canNext={false} handleBack={() => dispatch(backStage())} handleNext={() => ""} />
      </Box>
    </Box> :
    <Box>
      <StageTitle>Order submitted successfully!</StageTitle>
      <Separator sx={{ pb: 3 }} />
      <Typography variant='body1'>Please check your email for order confirmation.</Typography>
      <Grid container>
        { // if paid with cc
          submitToWarioResponse?.result?.payment?.status === 'COMPLETED' &&
          submitToWarioResponse.result.payment.totalMoney?.amount &&
          <Grid item sx={{ pt: 1 }} xs={12}>
            <Typography variant="body2">
              Payment of ${fCurrency(Number(submitToWarioResponse.result.payment.totalMoney.amount) / 100)} received {submitToWarioResponse.result.payment.cardDetails?.card ? ` from card ending in: ${submitToWarioResponse.result.payment.cardDetails.card.last4}!` : "!"}
              Here's your <Link href={submitToWarioResponse.result.payment.receiptUrl} target="_blank">receipt</Link></Typography>
          </Grid>
        }
        {creditApplied > 0 && storeCreditValidation !== null && storeCreditValidation.valid &&
          <Grid item sx={{ pt: 1 }} xs={12}>
            <Typography variant='h6'>Digital Gift Card number {storeCreditCode} debited {fCurrency(creditApplied)}.</Typography>
            <Typography variant="body2">
              {storeCreditValidation.amount === creditApplied ? "No balance remains." : `Balance of ${fCurrency(storeCreditValidation.amount - creditApplied)} remains.`}
            </Typography>
          </Grid>}
        <Grid item xs={12} sx={{ py: 3 }}>
          <WCheckoutCart />
        </Grid>
      </Grid>
    </Box>;
}