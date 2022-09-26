import React from 'react';
import { Box, useMediaQuery } from '@mui/material';
import { useAppSelector } from '../app/useHooks';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { NUM_STAGES } from '../config';
import { WarioButton } from '@wcp/wario-ux-shared';


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
  const useVerticalStepper = useMediaQuery(theme.breakpoints.up('md'));

  return <Box sx={{ float: 'right', display: 'block', mx: 'auto', width: '100%', pt: 3, pb: 2 }}>
    <Box sx={{ float: 'right', width: '33.3%', textAlign: 'right' }}>
      {hasNext ?
        <WarioButton
          size="small"
          endIcon={<KeyboardArrowRight />}
          onClick={handleNext}
          disabled={!canNext}
        > {nextText ?? "Next"}
        </WarioButton> : <div>&nbsp;</div>}
    </Box>
    <Box sx={{ py: 0.5, textAlign: 'center', verticalAlign: 'center', float: 'right', my: 'auto', height: '100%', minWidth: '33.3%'}}>
      {!useVerticalStepper ?
        <span>{`${currentStage + 1} / ${NUM_STAGES}`}</span> : <div>&nbsp;</div>
      }
    </Box>
    <Box sx={{ float: 'right', width: '33.3%', textAlign: 'left' }}>
      {hasBack ? <WarioButton size="small"
      startIcon={<KeyboardArrowLeft />}
        onClick={handleBack}
        disabled={!canBack} >
        {backText ?? "Back"}
      </WarioButton> : <div>&nbsp;</div>}
    </Box>
  </Box>;
};