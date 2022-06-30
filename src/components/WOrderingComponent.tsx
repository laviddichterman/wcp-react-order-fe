import React, { useCallback, useEffect, useState } from 'react';
import { SnackbarProvider } from 'notistack';
import { Typography, Button, Box, Stepper, Step, StepLabel } from '@mui/material';
import { WShopForProductsStage } from './step/WShopForProductsStageComponent';
import { GenerateMenu, IMenu } from '@wcp/wcpshared';
import { WFulfillmentStageComponent } from './step/WFulfillmentStageComponent';
import { useAppDispatch } from '../app/useHooks';
import { StepData, TIMING_POLLING_INTERVAL } from './common';
import { setCurrentTime, setPageLoadTime } from './WMetricsSlice';
import { MenuProvider } from '../app/MenuContext';

export function WOrderingComponent() {
  const dispatch = useAppDispatch();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const checkTiming = () => {
      dispatch(setCurrentTime(new Date().valueOf()));
    }
    dispatch(setPageLoadTime(new Date().valueOf()));
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
      if (canNext) {
        setStage(stage + 1);
      }
    }
    return (<Box className="order-nav" sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
      <Button
        color="inherit"
        disabled={canBack}
        onSubmit={handleBack}
        sx={{ mr: 1 }}
      >
        Back
      </Button>
      <Box sx={{ flex: '1 1 auto' }} />
      <Button onSubmit={() => handleNext(onSubmitCallback)} disabled={canNext} sx={{ mr: 1 }}>
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
  ];
  
  return (

      <MenuProvider>
        <div className="orderform">
          <span id="ordertop"></span>
          <Stepper activeStep={stage}>
            {STAGES.map((stg, i) => (
              <Step key={i} > {/* completed={stg.isComplete}> */}
                <StepLabel>{stg.stepperTitle}</StepLabel>
              </Step>))}
          </Stepper>
          <Box>
            {STAGES[stage].content}
          </Box>
        </div>
      </MenuProvider>
  );

}

