import React, { useState } from 'react';
import PropTypes, { InferProps } from "prop-types";
import { SnackbarProvider } from 'notistack';
import { Stepper, Step, StepLabel, StepContent } from '@mui/material';

const STAGES = [
  { friendlyTitle: (s: any) => "First, how and when would you like your order?", stepperTitle: "Timing" }];




export function WOrderingComponent({ catalog, services }: InferProps<typeof WOrderingComponent.propTypes>) {
  const [stage, setStage] = useState(1);


  return (
    <SnackbarProvider>
      <div className="orderform">
        <span id="ordertop"></span>
        <Stepper activeStep={stage}>
          <Step>
            <StepLabel></StepLabel>
            <StepContent>
              <div>
                <h3 className="flush--top">First, how and when would you like your order?</h3>
              </div>
            </StepContent>
          </Step>
        </Stepper>
      </div>

    </SnackbarProvider>);

}

WOrderingComponent.propTypes = {
  catalog: PropTypes.any.isRequired,
  services: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
};