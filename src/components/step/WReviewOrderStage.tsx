import React, { useState, useMemo } from 'react';
import { Typography, Checkbox, FormControlLabel } from '@mui/material';

import { WCheckoutCart } from '../WCheckoutCart';
import { ICREDIT_RESPONSE, OrderFulfillment, DeliveryOrderFulfillment, CustomerInfo, ITOTALS, GenerateServiceTimeDisplayString, DineInOrderFulfillment, CartEntry } from '../common';

import { DELIVERY_SERVICE, DINEIN_SERVICE, ENABLE_DINE_IN_PREPAYMENT } from '../../config';


const REQUEST_ANY = "By adding any special instructions, you will only be able to pay in person.";
const REQUEST_HALF = "While half toppings are not on the menu, we can do them (with the exception of half roasted garlic or half red sauce, half white sauce) but they are charged the same as full toppings. As such, we recommend against them as they're not a good value for the customer and an imbalance of toppings will cause uneven baking of your pizza.";
const REQUEST_SLICING = "In order to ensure the quality of our pizzas, we will not slice them. We'd recommend bringing anything from a bench scraper to a butter knife to slice the pizza. Slicing the whole pizza when it's hot inhibits the crust from properly setting, and can cause the crust to get soggy both during transit and as the pie is eaten. We want your pizza to be the best possible and bringing a tool with which to slice the pie will make a big difference. You will need to remove this request to continue with your order.";
const REQUEST_VEGAN = "Our pizzas cannot be made vegan or without cheese. If you're looking for a vegan option, our Beets By Schrute salad can be made vegan by omitting the bleu cheese.";;
const REQUEST_SOONER = "It looks like you're trying to ask us to make your pizza sooner. While we would love to do so, the times you were able to select represents our real-time availability. Please send us a text if you're looking for your pizza earlier and it's not a Friday, Saturday, or Sunday, otherwise, you'll need to remove this request to continue with your order.";

interface IWReviewOrderStage {
  menu: any;
  services: [string];
  linearCart: CartEntry[];
  customerInfo: CustomerInfo;
  creditResponse: ICREDIT_RESPONSE;
  fulfillmentInfo: OrderFulfillment;
  totals: ITOTALS;
}
export function WReviewOrderStage({ menu, linearCart, totals, creditResponse, customerInfo, services, fulfillmentInfo }: IWReviewOrderStage) {
  const serviceTimeDisplayString = useMemo(() => GenerateServiceTimeDisplayString(fulfillmentInfo), [fulfillmentInfo]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [acknowledgeInstructionsDialogue, setAcknowledgeInstructionsDialogue] = useState(false);
  const [disableSubmit, setDisableSubmit] = useState(false);
  const [specialInstructionsResponses, setSpecialInstructionsResponses] = useState<{ level: number, text: string }[]>([]);
  const setSpecialInstructionsIntermediate = (ins: string) => {
    const special_instructions_responses = [];
    let disableorder = false;
    const lowered = ins ? ins.toLowerCase() : "";
    if (REQUEST_ANY && acknowledgeInstructionsDialogue && !(fulfillmentInfo.getType() === DINEIN_SERVICE && !ENABLE_DINE_IN_PREPAYMENT)) {
      special_instructions_responses.push({level: 0, text: REQUEST_ANY});
    }
    if (REQUEST_HALF && (lowered.indexOf("split") >= 0 || lowered.indexOf("half") >= 0 || lowered.indexOf("1/2") >= 0)) {
      special_instructions_responses.push({level: 0, text: REQUEST_HALF});
    }
    if (REQUEST_SLICING && (lowered.indexOf("slice") >= 0 || lowered.indexOf("cut") >= 0)) {
      disableorder = true;
      special_instructions_responses.push({level: 1, text: REQUEST_SLICING});
    }
    if (REQUEST_SOONER && (lowered.indexOf("soon") >= 0 || lowered.indexOf("earl") >= 0 || lowered.indexOf("time") >= 0 || lowered.indexOf("asap") >= 0)) {
      disableorder = true;
      special_instructions_responses.push({level: 1, text: REQUEST_SOONER});
    }
    if (REQUEST_VEGAN && (lowered.indexOf("no cheese") >= 0 || lowered.indexOf("vegan") >= 0 || lowered.indexOf("without cheese") >= 0)) {
      special_instructions_responses.push({level: 0, text: REQUEST_VEGAN});
    }
    setDisableSubmit(disableorder);
    setSpecialInstructionsResponses(special_instructions_responses);
    setSpecialInstructions(ins);

  }
  return (
    <div ng-show="orderCtrl.s.stage === 5 && !orderCtrl.s.isProcessing">
      <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Everything look right?</Typography>
      <table>
        <tr>
          <td>Name</td>
          <td>{customerInfo.givenName} {customerInfo.familyName}</td>
        </tr>
        <tr>
          <td>Mobile Number</td>
          <td>{customerInfo.mobileNum}</td>
        </tr>
        <tr>
          <td>E-Mail</td>
          <td>{customerInfo.email}</td>
        </tr>
        <tr>
          <td>Service</td>
          <td><>{services[fulfillmentInfo.getType()]} on {fulfillmentInfo.dt.day} at {serviceTimeDisplayString}</></td>
        </tr>
        {fulfillmentInfo.getType() === DELIVERY_SERVICE ?
          <tr>
            <td>Address</td>
            <td>{(fulfillmentInfo as DeliveryOrderFulfillment).address.formatted_address}{(fulfillmentInfo as DeliveryOrderFulfillment).address.address2 ? `, ${(fulfillmentInfo as DeliveryOrderFulfillment).address.address2}` : ""}</td>
          </tr> : ""}
        {fulfillmentInfo.getType() === DINEIN_SERVICE ?
          <tr ng-if="orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN">
            <td>Party Size</td>
            <td>{(fulfillmentInfo as DineInOrderFulfillment).partySize}</td>
          </tr> : ""}
      </table>
      <WCheckoutCart menu={menu} linearCart={linearCart} totals={totals} fulfillment={fulfillmentInfo} creditResponse={creditResponse} />
      {fulfillmentInfo.getType() !== DELIVERY_SERVICE && (!creditResponse || !creditResponse.validation_successful) ?
        <div>
          <FormControlLabel
            control={<Checkbox checked={acknowledgeInstructionsDialogue} onChange={(_, checked) => setAcknowledgeInstructionsDialogue(checked)} />}
            label="I need to specify some special instructions (which may delay my order or change its cost) and I've already texted or emailed to ensure the request can be handled."
          />
          {acknowledgeInstructionsDialogue ? <textarea value={specialInstructions} onChange={(e) => setSpecialInstructionsIntermediate(e.target.value)} ng-change="orderCtrl.ChangedEscapableInfo()" /> : ""}
        </div> : ""}
      { specialInstructionsResponses.map((res, i) => <div key={i} className="wpcf7-response-output wpcf7-validation-errors">{res.text}</div>) }
      <div className="order-nav">
        <button type="submit" className="btn" ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
        <button type="submit" className="btn" ng-show="orderCtrl.HasNextStage() && (!orderCtrl.s.acknowledge_instructions_dialogue && !(orderCtrl.s.service_type === orderCtrl.CONFIG.DINEIN && !orderCtrl.CONFIG.ENABLE_DINE_IN_PREPAYMENT))" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage();">Next</button>
        <button type="submit" className="btn" disabled={disableSubmit} ng-show="orderCtrl.s.acknowledge_instructions_dialogue || (orderCtrl.s.service_type === orderCtrl.CONFIG.DINEIN && !orderCtrl.CONFIG.ENABLE_DINE_IN_PREPAYMENT)" ng-click="orderCtrl.ScrollTop(); orderCtrl.SubmitToWario()">Submit Order</button>
      </div>
    </div>
  )
}