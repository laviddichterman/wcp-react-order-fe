import React, {useEffect, useState } from 'react';
import { SnackbarProvider } from 'notistack';
import { Typography, Button, Box, Stepper, Step, StepLabel } from '@mui/material';
import { WShopForProductsStage } from './step/WShopForProductsStageComponent';
import { GenerateMenu, IMenu } from '@wcp/wcpshared';
import { WFulfillmentStageComponent } from './step/WFulfillmentStageComponent';
import { useAppSelector } from '../app/useHooks';

export function WOrderingComponent() {
  const [stage, setStage] = useState(0);
  const catalog = useAppSelector((s) => s.ws.catalog);
  const [menu, setMenu] = useState<IMenu | null>(null);
  useEffect(() => {
    if (catalog !== null) {
      const MENU = GenerateMenu(catalog, new Date());
      setMenu(MENU);
    }
  }, [catalog]);
  useEffect(() => {
    const interval = setInterval(checkTiming, 30000);
    return () => clearInterval(interval);
  }, []);
  const STAGES = [
    {
      ...WFulfillmentStageComponent.Stage,
      isComplete: useAppSelector(WFulfillmentStageComponent.Stage.isComplete),
    },
    {
      ...WShopForProductsStage.Stage,
      isComplete: useAppSelector(WShopForProductsStage.Stage.isComplete),
      title: useAppSelector(WShopForProductsStage.Stage.title)
    },
  ];
  const checkTiming = () => {
    console.log("updog");
  }

  const handleBack = function() {
    setStage(stage-1);
  }

  const handleNext = function() {
    if (STAGES[stage].isComplete) {
      setStage(stage+1);
    }
  }
  if (!menu) {
    return <div>Loading...</div>
  }

  return (
    <SnackbarProvider>
      <div className="orderform">
        <span id="ordertop"></span>
        <Stepper activeStep={stage}>
          {STAGES.map((stg, i) => (
          <Step key={i} completed={stg.isComplete}>
            <StepLabel>{stg.stepperTitle}</StepLabel>
          </Step>))}
        </Stepper>
        <Box>
        <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{STAGES[stage].title}</Typography>

        {STAGES[stage].content}
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
              <Button
                color="inherit"
                disabled={stage === 0}
                onClick={handleBack}
                sx={{ mr: 1 }}
              >
                Back
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              <Button onClick={handleNext} disabled={!STAGES[stage].isComplete} sx={{ mr: 1 }}>
                Next
              </Button>
            </Box>
        </Box>
      </div>
    </SnackbarProvider>);

}

