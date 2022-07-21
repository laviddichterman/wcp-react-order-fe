import React, { useCallback, useEffect, useState } from 'react';
import { Button, Box, Stepper, Step, StepContent, StepLabel } from '@mui/material';
import { WShopForProductsStage } from './step/WShopForProductsStageComponent';
import WFulfillmentStageComponent from './step/WFulfillmentStageComponent';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { MenuProvider } from '../app/MenuContext';
import { WCustomerInformationStage } from './step/WCustomerInformationStageComponent';
import WReviewOrderStage from './step/WReviewOrderStage';
import { WCheckoutStage } from './step/WCheckoutStageComponent';
import { WConfirmationStageComponent } from './step/WConfirmationStageComponent';
import { SquarePaymentFormProvider } from './SquarePaymentForm';
import { setStage } from '../app/slices/StepperSlice';

export function WOrderingComponent() {
  const dispatch = useAppDispatch();
  const stage = useAppSelector(s=>s.stepper.stage);
  const squareApplicationId = useAppSelector(s=>s.ws.settings!.config.SQUARE_APPLICATION_ID as string);
  const squareLocationId = useAppSelector(s=>s.ws.settings!.config.SQUARE_LOCATION as string);

  const STAGES = [
    {
      stepperTitle: "Timing",
      content: <WFulfillmentStageComponent />
    },
    {
      stepperTitle: "Add items",
      content: <WShopForProductsStage />
    },
    {
      stepperTitle: "Your info",
      content: <WCustomerInformationStage />
    },
    {
      stepperTitle: "Review order",
      content: <WReviewOrderStage  />
    },
    {
      stepperTitle: "Check Out",
      content: <WCheckoutStage />
    },
    {
      stepperTitle: "Confirmation",
      content: <WConfirmationStageComponent />
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

