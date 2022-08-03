
import { Box, Stepper, Step, StepLabel, useMediaQuery, useTheme } from '@mui/material';
import { PaymentForm } from 'react-square-web-payments-sdk';
import type * as Square from '@square/web-sdk';
// import { useNavigate, useLocation } from "react-router-dom";

// TODO: need to add an interceptor for forward/back when the user has gotten to 2nd stage or at least reasonably far

import WFulfillmentStageComponent from './step/WFulfillmentStageComponent';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { WCustomerInformationStage } from './step/WCustomerInformationStageComponent';
import WReviewOrderStage from './step/WReviewOrderStage';
import { WCheckoutStage } from './step/WCheckoutStageComponent';
import { CURRENCY, RoundToTwoDecimalPlaces } from '@wcp/wcpshared';
import { SelectBalanceAfterCredits } from '../app/store';
import { submitToWario, setSquareTokenizationErrors } from '../app/slices/WPaymentSlice';
import { WShopForProductsContainer } from './step/WShopForProductsStageContainer';
import { StepperTitle } from './styled/styled';

const STAGES = [
  {
    stepperTitle: "Timing",
    content: <WFulfillmentStageComponent />
  },
  {
    stepperTitle: "Add pizza!",
    content: <WShopForProductsContainer productSet='PRIMARY' />
  },
  {
    stepperTitle: "Add other stuff!",
    content: <WShopForProductsContainer productSet='SECONDARY' />
  },
  {
    stepperTitle: "Tell us about yourself",
    content: <WCustomerInformationStage />
  },
  {
    stepperTitle: "Review order",
    content: <WReviewOrderStage />
  },
  {
    stepperTitle: "Check out",
    content: <WCheckoutStage />
  }
];

export function WOrderingComponent() {
  const dispatch = useAppDispatch();
  const stage = useAppSelector(s => s.stepper.stage);
  const squareApplicationId = useAppSelector(s => s.ws.settings!.config.SQUARE_APPLICATION_ID as string);
  const squareLocationId = useAppSelector(s => s.ws.settings!.config.SQUARE_LOCATION as string);
  const submitToWarioStatus = useAppSelector(s => s.payment.submitToWarioStatus);
  const balanceAfterCredits = useAppSelector(SelectBalanceAfterCredits);
  const theme = useTheme();
  const useStepper = useMediaQuery(theme.breakpoints.up('md'));
  const cardTokenizeResponseReceived = async (props: Square.TokenResult, verifiedBuyer?: Square.VerifyBuyerResponseDetails) => {
    if (props.token) {
      dispatch(submitToWario(props.token));
    } else if (props.errors) {
      dispatch(setSquareTokenizationErrors(props.errors));
    }
  }

  const createPaymentRequest: () => Square.PaymentRequestOptions = () => {
    return {
      countryCode: "US",
      currencyCode: CURRENCY.USD,
      total: { label: "Total", amount: RoundToTwoDecimalPlaces(balanceAfterCredits).toFixed(2) }
    }
  }

  return (
        <PaymentForm
          applicationId={squareApplicationId}
          locationId={squareLocationId}
          createPaymentRequest={createPaymentRequest}
          cardTokenizeResponseReceived={cardTokenizeResponseReceived}
        >
          {useStepper ?
            <Stepper sx={{ px: 1, pt: 2, mx: 'auto' }} activeStep={stage} >
              {STAGES.map((stg, i) => (
                <Step key={i} id={`WARIO_step_${i}`} completed={stage > i || submitToWarioStatus === 'SUCCEEDED'}>
                  <StepLabel><StepperTitle>{stg.stepperTitle}</StepperTitle></StepLabel>
                </Step>))}
            </Stepper> : <></>
          }
          <Box sx={{ mx: 'auto', pt: 1 }}>
            {STAGES[stage].content}
          </Box>
        </PaymentForm>

  );
}

