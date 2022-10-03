import { useState, useMemo, useCallback } from 'react';
import { Box, Typography, Grid, Input, Link } from '@mui/material';
import { ErrorResponseOutput, Separator, SquareButtonCSS, StageTitle, WarioButton, WarioToggleButton, LoadingScreen, SelectTipPreamble } from '@wcp/wario-ux-shared';
import { CreditCard /*, GooglePay, ApplePay */} from 'react-square-web-payments-sdk';

import { WCheckoutCart } from '../WCheckoutCart';
import { setTip, submitToWario } from '../../app/slices/WPaymentSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { SelectAutoGratutityEnabled, SelectBalanceAfterCredits, SelectGiftCardValidationsWithAmounts, SelectTipBasis, SelectTipValue } from '../../app/store';
import { StoreCreditSection } from '../StoreCreditSection';
import { useEffect } from 'react';
import { backStage } from '../../app/slices/StepperSlice';
import { Navigation } from '../Navigation';
import { TipSelection, ComputeTipValue, MoneyToDisplayString, PaymentMethod, OrderPayment, CURRENCY } from '@wcp/wcpshared';
import { incrementTipAdjusts, incrementTipFixes } from '../../app/slices/WMetricsSlice';

const TIP_SUGGESTION_15: TipSelection = { value: .15, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_20: TipSelection = { value: .2, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_25: TipSelection = { value: .25, isSuggestion: true, isPercentage: true };
const TIP_SUGGESTION_30: TipSelection = { value: .3, isSuggestion: true, isPercentage: true };

const TIP_SUGGESTIONS = [TIP_SUGGESTION_15, TIP_SUGGESTION_20, TIP_SUGGESTION_25, TIP_SUGGESTION_30];

export function WCheckoutStage() {
  const dispatch = useAppDispatch();
  const tipBasis = useAppSelector(SelectTipBasis);
  const balance = useAppSelector(SelectBalanceAfterCredits);
  //const selectedTipAmount = useAppSelector(SelectTipValue);
  const submitToWarioResponse = useAppSelector(s => s.payment.warioResponse);
  const giftCreditsApplied = useAppSelector(SelectGiftCardValidationsWithAmounts);
  const submitToWarioStatus = useAppSelector(s => s.payment.submitToWarioStatus);
  //const specialInstructions = useAppSelector(s => s.payment.specialInstructions);
  const autogratEnabled = useAppSelector(SelectAutoGratutityEnabled);
  const TIP_PREAMBLE = useAppSelector(SelectTipPreamble);
  const selectedTipValue = useAppSelector(SelectTipValue);
  const TwentyPercentTipValue = useMemo(() => ComputeTipValue(TIP_SUGGESTION_20, tipBasis), [tipBasis]);
  const tipSuggestionsArray = useMemo(() => TIP_SUGGESTIONS.slice(autogratEnabled ? 1 : 0, autogratEnabled ? TIP_SUGGESTIONS.length : TIP_SUGGESTIONS.length - 1), [autogratEnabled]);
  const currentTipSelection = useAppSelector(s => s.payment.selectedTip);
  const isCustomTipSelected = useMemo(() => currentTipSelection?.isSuggestion === false ?? false, [currentTipSelection]);
  const [customTipAmount, setCustomTipAmount] = useState<string>(MoneyToDisplayString(ComputeTipValue(currentTipSelection || TIP_SUGGESTION_20, tipBasis), false));
  const customTipAsIMoney = useMemo(() => {
    const parsedCustomTipAmount = parseFloat(customTipAmount);
    return (!isFinite(parsedCustomTipAmount) || isNaN(parsedCustomTipAmount) || parsedCustomTipAmount < 0) ? 
    { currency: CURRENCY.USD, amount: 0 } : 
    { amount : Math.round(parsedCustomTipAmount * 100), currency: CURRENCY.USD }
  }, [customTipAmount]);
  const squareTokenErrors = useAppSelector(s => s.payment.squareTokenErrors);
  const orderSubmitErrors = useAppSelector(s => s.payment.orderSubmitErrors);
  useEffect(() => {
    if (currentTipSelection === null || (autogratEnabled && TwentyPercentTipValue.amount > selectedTipValue.amount)) {
      dispatch(setTip(TIP_SUGGESTION_20));
    }
  }, [currentTipSelection, autogratEnabled, TwentyPercentTipValue, selectedTipValue, dispatch])

  const generatePaymentHtml = useCallback((payment: OrderPayment) => {
    switch (payment.t) {
      case PaymentMethod.Cash:
        return (<>Somehow you paid cash?</>
        );
      case PaymentMethod.CreditCard:
        return (
          <>
            <Typography variant="body2">
              Payment of {MoneyToDisplayString(payment.amount, true)} received {payment.payment.last4 ? ` from card ending in: ${payment.payment.last4}!` : "!"}
              <br />Here's your <Link href={payment.payment.receiptUrl} target="_blank">receipt</Link></Typography>
          </>);
      case PaymentMethod.StoreCredit:
        const validation = giftCreditsApplied.find(x => x.code === payment.payment.code)!;
        const balance = { amount: validation.validation.amount.amount - payment.amount.amount, currency: payment.amount.currency };
        return (
          <>
            <Typography variant='h6'>Digital Gift Card number <Typography sx={{ textTransform: "none" }}>{payment.payment.code}</Typography> debited {MoneyToDisplayString(payment.amount, true)}.</Typography>
            <Typography variant="body2">
              {balance.amount === 0 ? "No balance remains." : `Balance of ${MoneyToDisplayString(balance, true)} remains.`}
            </Typography>
          </>);
    }
  }, [giftCreditsApplied])
  const onChangeSelectedTip = (tip: TipSelection) => {
    dispatch(setTip(tip));
  }
  const submitNoBalanceDue = () => {
    dispatch(submitToWario(null))
  }

  const resetCustomTip = () => {
    const resetValue = ComputeTipValue(TIP_SUGGESTION_20, tipBasis);
    setCustomTipAmount((resetValue.amount / 100).toFixed(2));
    dispatch(setTip({ value: resetValue, isPercentage: false, isSuggestion: false }));
  }

  const onSelectSuggestedTip = (tip: TipSelection) => {
    dispatch(incrementTipAdjusts());
    onChangeSelectedTip(tip);
    const newTipCashValue = ComputeTipValue(tip, tipBasis);
    if (customTipAsIMoney.amount < newTipCashValue.amount) {
      setCustomTipAmount(MoneyToDisplayString(newTipCashValue, false));
    }
  }

  // actually sets the custom tip, this should be called onBlur
  const setCustomTipHandler = (value: string) => {
    dispatch(incrementTipAdjusts());
    const numericValue = parseFloat(value);
    if (!isFinite(numericValue) || isNaN(numericValue) || numericValue < 0 || (autogratEnabled && Math.round(numericValue * 100) < TwentyPercentTipValue.amount)) {
      dispatch(incrementTipFixes());
      resetCustomTip();
    } else {
      const newTipMoney = { amount : Math.round(numericValue * 100), currency: CURRENCY.USD };
      setCustomTipAmount(MoneyToDisplayString(newTipMoney, false));
      dispatch(setTip({ value: newTipMoney, isPercentage: false, isSuggestion: false }));
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
                <Grid item xs={12}><Typography sx={{ color: 'white' }} variant='h4'>{((tip.value as number) * 100)}%</Typography></Grid>
                <Grid item xs={12}><Typography sx={{ color: 'white' }} variant='subtitle2'>{MoneyToDisplayString(ComputeTipValue(tip, tipBasis), false)}</Typography></Grid>
              </Grid>
            </WarioToggleButton>
          </Grid>
        )}
        <Grid item sx={{ px: 0.5, pt: 1 }} xs={12}>
          <WarioToggleButton selected={isCustomTipSelected} fullWidth value={customTipAmount} onClick={() => setCustomTipHandler(customTipAmount)} >
            <Grid container>
              <Grid item xs={12}>
                <Typography variant='h4' sx={{ color: 'white' }}>Custom Tip Amount</Typography>
              </Grid>
              <Grid item xs={12} sx={{ height: isCustomTipSelected ? '4em' : '2.5em' }}>
                {isCustomTipSelected ?
                  <Input
                    sx={{ pt: 0 }}
                    size='small'
                    disableUnderline
                    value={customTipAmount}
                    onChange={(e) => setCustomTipAmount(e.target.value)}
                    onBlur={(e) => setCustomTipHandler(e.target.value)}
                    type="number"
                    inputProps={{ inputMode: 'decimal', min: 0, sx: { pt: 0, textAlign: 'center', color: 'white' }, step: 1 }}
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
            {balance.amount > 0 ? // && (specialInstructions === null || specialInstructions.length < 50) ?
              <>
                {/* <ApplePay>Pay with Apple Pay</ApplePay>
                <GooglePay>Pay with Google Pay</GooglePay> */}
                <CreditCard
                  // @ts-ignore 
                  focus={""}
                  buttonProps={{
                    isLoading: submitToWarioStatus === 'PENDING', css: SquareButtonCSS
                  }}>
                  Submit Order
                </CreditCard>
                
                
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
        {submitToWarioResponse?.success && submitToWarioResponse!.result?.payments.map((payment, i) => {
          return (
            <Grid key={`${payment.t}${i}`} item sx={{ pt: 1 }} xs={12} >
              {generatePaymentHtml(payment)}
            </Grid>)
        })}
        <Grid item xs={12} sx={{ py: 3 }}>
          <WCheckoutCart />
        </Grid>
      </Grid>
    </Box >;
}