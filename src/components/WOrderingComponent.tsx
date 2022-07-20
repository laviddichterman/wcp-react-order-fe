import React, { useCallback, useEffect, useState } from 'react';
import { Button, Box, Stepper, Step, StepContent, StepLabel } from '@mui/material';
import { WShopForProductsStage } from './step/WShopForProductsStageComponent';
import { WFulfillmentStageComponent } from './step/WFulfillmentStageComponent';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { MenuProvider } from '../app/MenuContext';
import { WCustomerInformationStage } from './step/WCustomerInformationStageComponent';
import { WReviewOrderStage } from './step/WReviewOrderStage';
import { WCheckoutStage } from './step/WCheckoutStageComponent';
import { WConfirmationStageComponent } from './step/WConfirmationStageComponent';
import { SquarePaymentFormProvider } from './SquarePaymentForm';
import { setStage } from '../app/slices/StepperSlice';

export function WOrderingComponent() {
  const dispatch = useAppDispatch();
  const stage = useAppSelector(s=>s.stepper.stage);
  const squareApplicationId = useAppSelector(s=>s.ws.settings!.config.SQUARE_APPLICATION_ID as string);
  const squareLocationId = useAppSelector(s=>s.ws.settings!.config.SQUARE_LOCATION as string);
  const NavigationCallback = useCallback((onSubmitCallback: () => void, canNext: boolean, canBack: boolean) => {
    const handleBack = function () {
      if (canBack) {
        dispatch(setStage(stage - 1));
      }
    }

    const handleNext = function (cb: () => void) {
      if (canNext) {
        cb();
        dispatch(setStage(stage + 1));
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
  }, [stage, dispatch]);

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
        <SquarePaymentFormProvider applicationId={squareApplicationId} locationId={squareLocationId} >
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
        </SquarePaymentFormProvider>
      </MenuProvider>
  );

}

