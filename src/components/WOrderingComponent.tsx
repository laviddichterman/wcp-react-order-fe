import React, { useCallback, useEffect, useState } from 'react';
import { Button, Box, Stepper, Step, StepContent, StepLabel } from '@mui/material';
import { WShopForProductsStage } from './step/WShopForProductsStageComponent';
import { WFulfillmentStageComponent } from './step/WFulfillmentStageComponent';
import { useAppDispatch } from '../app/useHooks';
import { TIMING_POLLING_INTERVAL } from './common';
import { setCurrentTime, setPageLoadTime } from './WMetricsSlice';
import { MenuProvider } from '../app/MenuContext';
import { WCustomerInformationStage } from './step/WCustomerInformationStageComponent';
import { WReviewOrderStage } from './step/WReviewOrderStage';
import { WCheckoutStage } from './step/WCheckoutStageComponent';
import { PaymentForm } from 'react-square-web-payments-sdk';
import { WConfirmationStageComponent } from './step/WConfirmationStageComponent';

export function WOrderingComponent() {
  const dispatch = useAppDispatch();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const checkTiming = () => {
      dispatch(setCurrentTime(new Date().valueOf()));
      // TODO: need to add a check how fulfillment is impacted by the change of availability from the new "current time"
      // then we need to check how the cart is impacted by those changes
      // hopefully we can keep all that logic out of here and just update the current time
    }
    dispatch(setPageLoadTime(new Date().valueOf()));
    checkTiming();
    const interval = setInterval(checkTiming, TIMING_POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [dispatch]);

  const NavigationCallback = useCallback((onSubmitCallback: () => void, canNext: boolean, canBack: boolean) => {
    const handleBack = function () {
      if (canBack) {
        setStage(stage - 1);
      }
    }

    const handleNext = function (cb: () => void) {
      console.log("trying to handle next");
      if (canNext) {
        cb();
        setStage(stage + 1);
      }
    }
    return (<Box className="order-nav" sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
      <Button
        color="inherit"
        disabled={!canBack}
        onClick={handleBack}
        sx={{ mr: 1 }}
      >
        Back
      </Button>
      <Box sx={{ flex: '1 1 auto' }} />
      <Button onClick={() => handleNext(onSubmitCallback)} disabled={!canNext} sx={{ mr: 1 }}>
        Next
      </Button>
      {/* <button type="submit" className="btn" ng-disabled="!orderCtrl.s.date_valid || (orderCtrl.CONFIG.TERMS_LIST[orderCtrl.s.service_type].length > 0 && !orderCtrl.s.acknowledge_terms) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && (!orderCtrl.s.is_address_validated)) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN && (Number.isNaN(orderCtrl.s.number_guests) || orderCtrl.s.number_guests < 1 || orderCtrl.s.number_guests > orderCtrl.CONFIG.MAX_PARTY_SIZE))" ng-show="orderCtrl.HasNextStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage(); orderCtrl.ClearTimeoutFlag();">Next</button> */}
    </Box>
    )
  }, [stage]);

  const STAGES = [
    {
      stepperTitle: "Timing",
      content: <WFulfillmentStageComponent navComp={NavigationCallback} />
    },
    {
      stepperTitle: "Add items",
      content: <WShopForProductsStage navComp={NavigationCallback} />
    },
    {
      stepperTitle: "Your info",
      content: <WCustomerInformationStage navComp={NavigationCallback} />
    },
    {
      stepperTitle: "Review order",
      content: <WReviewOrderStage navComp={NavigationCallback} />
    },
    {
      stepperTitle: "Check Out",
      content: <WCheckoutStage navComp={NavigationCallback} />
    },
    {
      stepperTitle: "Confirmation",
      content: <WConfirmationStageComponent navComp={NavigationCallback} />
    },
  ];
  
  return (

      <MenuProvider>
        <PaymentForm applicationId='sq0idp-5Sc3Su9vHj_1Xf4t6-9CZg' locationId='EGPJ5YTX6F2TP' cardTokenizeResponseReceived={(token, verifiedBuyer) => {
        console.info('Token:', token);
        console.info('Verified Buyer:', verifiedBuyer);
      }}>
        <div className="orderform">
          <span id="ordertop"></span>
          <Stepper activeStep={stage} orientation="vertical">
            {STAGES.map((stg, i) => (
              <Step key={i} >
                <StepLabel>{stg.stepperTitle}</StepLabel>
                <StepContent>
                  {stg.content}
                </StepContent>
              </Step>))}
          </Stepper>
          {/* <Box>
            {STAGES[stage].content}
          </Box> */}
        </div>
        </PaymentForm>
      </MenuProvider>
  );

}

