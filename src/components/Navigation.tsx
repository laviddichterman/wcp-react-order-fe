import React from 'react';
import { Button, Box, MobileStepper, useMediaQuery } from '@mui/material';
import { useAppSelector } from '../app/useHooks';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { NUM_STAGES, STEPPER_STAGE_ENUM } from '../config';


export interface NavigationProps {
  hasBack?: boolean;
  hasNext?: boolean;
  canNext: boolean;
  canBack: boolean;
  handleNext: React.MouseEventHandler<HTMLButtonElement>;
  handleBack: React.MouseEventHandler<HTMLButtonElement>;
  nextText?: string;
  backText?: string;
}

export function Navigation({ canNext, canBack, nextText = "Next", backText = "Back", handleNext, handleBack, hasBack = true, hasNext = true }: NavigationProps) {
  const currentStage = useAppSelector(s => s.stepper.stage);
  const theme = useTheme();
  const useVerticalStepper = useMediaQuery(theme.breakpoints.up('sm'));

  return useVerticalStepper ?
    <Box className="order-nav" sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
      {hasBack && <Button
        color="inherit"
        disabled={!canBack}
        onClick={handleBack}
        sx={{ mr: 1 }}
      >
        {backText}
      </Button>}
      <Box sx={{ flex: '1 1 auto' }} />
      { hasNext && 
      <Button 
        onClick={handleNext} 
        disabled={!canNext} 
        sx={{ mr: 1 }}>
        {nextText}
      </Button> }
      {/* <button type="submit" className="btn" ng-disabled="!orderCtrl.s.date_valid || (orderCtrl.CONFIG.TERMS_LIST[orderCtrl.s.service_type].length > 0 && !orderCtrl.s.acknowledge_terms) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && (!orderCtrl.s.is_address_validated)) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN && (Number.isNaN(orderCtrl.s.number_guests) || orderCtrl.s.number_guests < 1 || orderCtrl.s.number_guests > orderCtrl.CONFIG.MAX_PARTY_SIZE))" ng-show="orderCtrl.HasNextStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage(); orderCtrl.ClearTimeoutFlag();">Next</button> */}
    </Box> :
    <MobileStepper
      variant="text"
      steps={NUM_STAGES}
      position="static"
      activeStep={currentStage}
      
      nextButton={ hasNext ? 
      <Button
          size="small"
          onClick={handleNext}
          disabled={!canNext}
        >
          {nextText ?? "Next"}
          {theme.direction === 'rtl' ? (
            <KeyboardArrowLeft />
          ) : (
            <KeyboardArrowRight />
          )}
        </Button> : ""
      }
      backButton={ hasBack ?
        <Button size="small"
          onClick={handleBack}
          disabled={!canBack} >
          {theme.direction === 'rtl' ? (
            <KeyboardArrowRight />
          ) : (
            <KeyboardArrowLeft />
          )}
          {backText ?? "Back"}
        </Button> : ""
      }
    />;
};