import { useState } from 'react';
import { TextField, Checkbox, FormControlLabel, Table, TableBody, TableContainer, TableRow, TableCell, Paper } from '@mui/material';

import { WCheckoutCart } from '../WCheckoutCart';
import { WDateUtils } from '@wcp/wcpshared';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { SelectServiceDateTime } from '../../app/slices/WFulfillmentSlice';
import { format } from 'date-fns';
import { backStage, nextStage } from '../../app/slices/StepperSlice';
import { Navigation } from '../Navigation';
import { setSpecialInstructions } from '../../app/slices/WPaymentSlice';
import { SelectServiceTimeDisplayString } from '../../app/store';
import { Separator, StageTitle, WarningResponseOutput, SelectMessageRequestHalf, SelectMessageRequestSlicing, SelectMessageRequestVegan } from '@wcp/wario-ux-shared';


const REQUEST_ANY = "By adding any special instructions, the cost of your order may increase and it will take longer. Please text the restaurant with your special request before making it here.";
const REQUEST_SOONER = "It looks like you're trying to ask us to make your pizza sooner. While we would love to do so, the times you were able to select represents our real-time availability. Please send us a text if you're looking for your pizza earlier and it's not a Friday, Saturday, or Sunday, otherwise, you'll need to remove this request to continue with your order.";

export default function WReviewOrderStage() {
  const dispatch = useAppDispatch();
  const REQUEST_HALF = useAppSelector(SelectMessageRequestHalf);
  const REQUEST_SLICING = useAppSelector(SelectMessageRequestSlicing);
  const REQUEST_VEGAN = useAppSelector(SelectMessageRequestVegan);
  const fulfillments = useAppSelector(s => s.ws.fulfillments!);
  const { givenName, familyName, mobileNum, email } = useAppSelector(s => s.ci);
  const selectedService = useAppSelector(s => s.fulfillment.selectedService);
  const serviceTimeDisplayString = useAppSelector(SelectServiceTimeDisplayString);
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const dineInInfo = useAppSelector(s => s.fulfillment.dineInInfo);
  const deliveryInfo = useAppSelector(s => s.fulfillment.deliveryInfo);
  const specialInstructions = useAppSelector(s=>s.payment.specialInstructions);
  const [acknowledgeInstructionsDialogue, setAcknowledgeInstructionsDialogue] = useState(false);
  const [disableSubmit, setDisableSubmit] = useState(false); // switch to useMemo
  const [specialInstructionsResponses, setSpecialInstructionsResponses] = useState<{ level: number, text: string }[]>([]);
  const setSpecialInstructionsIntermediate = (ins: string) => {
    const special_instructions_responses = [];
    let disableorder = false;
    const lowered = ins ? ins.toLowerCase() : "";
    if (REQUEST_ANY && acknowledgeInstructionsDialogue) {
      special_instructions_responses.push({ level: 0, text: REQUEST_ANY });
    }
    if (REQUEST_HALF && (lowered.indexOf("split") >= 0 || lowered.indexOf("half") >= 0 || lowered.indexOf("1/2") >= 0)) {
      special_instructions_responses.push({ level: 0, text: REQUEST_HALF });
    }
    if (REQUEST_SLICING && (lowered.indexOf("slice") >= 0 || lowered.indexOf("cut") >= 0)) {
      disableorder = true;
      special_instructions_responses.push({ level: 1, text: REQUEST_SLICING });
    }
    if (REQUEST_SOONER && (lowered.indexOf("soon") >= 0 || lowered.indexOf("earl") >= 0 || lowered.indexOf("time") >= 0 || lowered.indexOf("asap") >= 0)) {
      disableorder = true;
      special_instructions_responses.push({ level: 1, text: REQUEST_SOONER });
    }
    if (REQUEST_VEGAN && (lowered.indexOf("no cheese") >= 0 || lowered.indexOf("vegan") >= 0 || lowered.indexOf("without cheese") >= 0)) {
      special_instructions_responses.push({ level: 0, text: REQUEST_VEGAN });
    }
    setDisableSubmit(disableorder);
    setSpecialInstructionsResponses(special_instructions_responses);
    dispatch(setSpecialInstructions(ins));
  }
  const handleSetAcknowledgeInstructionsDialogue = (checked : boolean) => {
    setAcknowledgeInstructionsDialogue(checked);
    if (checked) {
      setSpecialInstructionsIntermediate("");
    } else {
      setSpecialInstructionsResponses([]);
    }
  }

  if (selectedService === null || serviceDateTime === null) {
    return <div>You found a bug</div>;
  }
  return (
    <div>
      <StageTitle>Everything look right?</StageTitle>
      <Separator />
      <TableContainer component={Paper} sx={{pb: 3}} >
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>{givenName} {familyName}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Mobile Number</TableCell>
              <TableCell>{mobileNum}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>E-Mail</TableCell>
              <TableCell>{email}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Service</TableCell>
              <TableCell>{fulfillments[selectedService].displayName} on {format(serviceDateTime, WDateUtils.ServiceDateDisplayFormat)} at {serviceTimeDisplayString}</TableCell>
            </TableRow>
            {dineInInfo &&
              <TableRow>
                <TableCell>Party Size</TableCell>
                <TableCell>{dineInInfo.partySize}</TableCell>
              </TableRow>
            }
            {deliveryInfo &&
              <TableRow>
                <TableCell>Delivery Address</TableCell>
                <TableCell>{deliveryInfo.address}{deliveryInfo.address2 && ` ${deliveryInfo.address2}`}{`, ${deliveryInfo.zipcode}`}</TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
      </TableContainer>
      <WCheckoutCart />
      <div>
        <FormControlLabel
          control={<Checkbox checked={acknowledgeInstructionsDialogue} onChange={(_, checked) => handleSetAcknowledgeInstructionsDialogue(checked)} />}
          label="I need to specify some special instructions (which may delay my order or change its cost) and I've already texted or emailed to ensure the request can be handled."
        />
        {acknowledgeInstructionsDialogue ? <TextField fullWidth multiline value={specialInstructions || ""} onChange={(e) => setSpecialInstructionsIntermediate(e.target.value)} /> : ""}
      </div>
      {specialInstructionsResponses.map((res, i) => <WarningResponseOutput key={i}>{res.text}</WarningResponseOutput>)}
      <Navigation canBack canNext={!disableSubmit} handleBack={()=>dispatch(backStage())} handleNext={() => dispatch(nextStage())} />
    </div >
  )
}