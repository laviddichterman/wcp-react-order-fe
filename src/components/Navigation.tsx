import React from 'react';
import { Grid, useMediaQuery } from '@mui/material';
import { useAppSelector } from '../app/useHooks';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { NUM_STAGES } from '../config';
import { WarioButton } from './styled/styled';


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

  return <Grid container sx={{ mx: 'auto', width: '100%', pt: 3, pb: 2 }}>
    <Grid item xs={4} sx={{ display: "flex", justifyContent: "flex-start" }}>
      {hasBack && <WarioButton size="small"
        onClick={handleBack}
        disabled={!canBack} >
        <KeyboardArrowLeft sx={{ ml: -1 }} />
        {backText ?? "Back"}
      </WarioButton>}
    </Grid>
    <Grid item xs={4} sx={{ mx: 'auto', width: '100%', textAlign: 'center' }}>
      {!useVerticalStepper &&
        <span>{`${currentStage + 1} / ${NUM_STAGES}`}</span>
      }
    </Grid>
    <Grid item xs={4} sx={{ display: "flex", justifyContent: "flex-end" }}>
      {hasNext &&
        <WarioButton
          size="small"
          onClick={handleNext}
          disabled={!canNext}
        > {nextText ?? "Next"}
          <KeyboardArrowRight sx={{ mr: -1 }} />
        </WarioButton>}
    </Grid>
  </Grid>;
};