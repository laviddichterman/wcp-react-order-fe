import React, { useCallback, useEffect, useState } from 'react';
import { Button, Box, Stepper, Step, StepContent, StepLabel } from '@mui/material';
import { useAppSelector } from '../app/useHooks';
import { STEPPER_STAGE_ENUM } from '../app/slices/StepperSlice';


export interface NavigationProps {
  canNext: boolean;
  canBack: boolean;
  handleNext: React.MouseEventHandler<HTMLButtonElement>;
  handleBack: React.MouseEventHandler<HTMLButtonElement>;
  nextText?: string;
  backText?: string;
}


export function Navigation({ canNext, canBack, nextText, backText = "Back", handleNext, handleBack } : NavigationProps) {
  const currentStage = useAppSelector(s=>s.stepper.stage);

    return (<Box className="order-nav" sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
      { currentStage !== STEPPER_STAGE_ENUM.TIMING && <Button
        color="inherit"
        disabled={!canBack}
        onClick={handleBack}
        sx={{ mr: 1 }}
      >
        {backText ?? "Back"}
      </Button>}
      <Box sx={{ flex: '1 1 auto' }} />
      <Button onClick={handleNext} disabled={!canNext} sx={{ mr: 1 }}>
        {nextText ?? "Next"}
      </Button>
      {/* <button type="submit" className="btn" ng-disabled="!orderCtrl.s.date_valid || (orderCtrl.CONFIG.TERMS_LIST[orderCtrl.s.service_type].length > 0 && !orderCtrl.s.acknowledge_terms) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && (!orderCtrl.s.is_address_validated)) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN && (Number.isNaN(orderCtrl.s.number_guests) || orderCtrl.s.number_guests < 1 || orderCtrl.s.number_guests > orderCtrl.CONFIG.MAX_PARTY_SIZE))" ng-show="orderCtrl.HasNextStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage(); orderCtrl.ClearTimeoutFlag();">Next</button> */}
    </Box>
    )
  };

