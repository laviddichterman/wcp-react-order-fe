import React, { useState, useCallback, useMemo } from 'react';
import PropTypes, { InferProps } from "prop-types";
import { SnackbarProvider } from 'notistack';
import { Link, Box, Checkbox, Stepper, Step, StepLabel, StepContent, Button, Typography, Radio, RadioGroup, FormControl, FormControlLabel, FormLabel } from '@mui/material';
import { MobileDatePicker } from '@mui/x-date-pickers';

import { WProductComponent } from './WProductComponent';
import { StoreCreditInputComponent } from './StoreCreditInputComponent';

import { SquarePaymentForm } from './SquarePaymentForm';

import { PIZZAS_CATID, DELIVERY_SERVICE, TAX_RATE, TIP_PREAMBLE } from '../config';
import { fCurrency, fPercent } from '../utils/numbers';

const GenerateServiceTimeDisplayString = (service : number , serviceTime : number) => service === DELIVERY_SERVICE ? `${serviceTime} to later` : `${serviceTime}`;

const STAGES = [
  { friendlyTitle: (s: any) => "First, how and when would you like your order?", stepperTitle: "Timing" }];
const SERVICE_TERMS_LIST = [[], ["All of our party members 5 years of age and up will provide proof (either digital or physical) of full COVID-19 vaccination AND BOOSTER (if eligible) along with matching ID to Windy City Pie upon arrival.",
  "All members of our party consent to an IR temperature check.",
  "All members of our party who have recently had a COVID-19 infection have tested negative on a rapid test since their last infection.",
  "All members of our party will remain masked at all times not eating or drinking.",
  "All members of our party are actively monitoring for any possible COVID-19 symptoms and have not had any.",
  "Our party understands that placing this order is a commitment to pay for the items in the order, even if we cannot consume them due to violation of Windy City Pie's COVID-19 safety protocols.",
  "Our party understands that table reservations last 60 minutes from the time selected below. (We're flexible if there's no one waiting.)",
  "Our full party will arrive at least 15 minutes before the time we select below. We understand the pizza is scheduled to come out of the oven at the time selected below."],
[]];

const getTermsForService = (service: number | null) => service !== null ? SERVICE_TERMS_LIST[service] : [];

// handy class representing a line in the product cart
// useful to allow modifications on the product by setting it to a new product instance
// instead of modifying the product instance itself
class CartEntry {
  catid: string;
  pi: any;
  quantity: number;
  can_edit: boolean;
  locked: boolean;
  constructor(catid: string, product: any, quantity: number, can_edit: boolean) {
    this.catid = catid;
    this.pi = product;
    this.quantity = quantity;
    this.can_edit = can_edit;
    this.locked = false;
  }
};

const CREDIT_RESPONSE_PROPTYPE = PropTypes.exact({
  type: PropTypes.string.isRequired,
  validation_successful: PropTypes.bool.isRequired,
  validation_fail: PropTypes.bool.isRequired,
  validation_processing: PropTypes.bool.isRequired,
  code: PropTypes.string.isRequired,
  amount_used: PropTypes.number.isRequired,
  amount: PropTypes.number.isRequired
});
const TOTALS_PROPTYPE = PropTypes.exact({
  deliveryFee: PropTypes.number.isRequired,
  balance: PropTypes.number.isRequired,
  tip_value: PropTypes.number.isRequired,
  computed_tax: PropTypes.number.isRequired,
  computed_subtotal: PropTypes.number.isRequired
}).isRequired;

interface Cart {
  [key: string]: CartEntry[];
};

const GenerateLinearCart = (cart: Cart) => {
  const pizza_portion: CartEntry[] = [];
  const extras_portion: CartEntry[] = [];
  Object.entries(cart).forEach(([key, values]: [string, CartEntry[]]) => {
    values.forEach((entry: CartEntry) => {
      if (key === PIZZAS_CATID) {
        pizza_portion.push(entry);
      }
      else {
        extras_portion.push(entry);
      }
    })
  })
  return pizza_portion.concat(extras_portion);
}

function WOrderCart({ menu, cart, isProductEditDialogOpen }: InferProps<typeof WOrderCart.propTypes>) {
  const setRemoveEntry = (i: number) => {
  };
  const setEntryQuantity = (i: number, quantity: string, check: boolean) => {
  };
  const setProductToEdit = (entry: CartEntry) => {
  };
  const linearCart = useMemo(() => GenerateLinearCart(cart), [cart]);
  return linearCart.length === 0 ? <>Empty</> :
    <div className="cart">
      <hr className="separator" />
      <h3 className="flush">Current Order</h3>
      <div className="content">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {linearCart.map((cartEntry: any, i: number) =>
              <tr key={i} className={`cart-item${cartEntry.can_edit ? " editible" : ""}`}>
                <td>
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="menu-list__item">
                      <WProductComponent product={cartEntry.pi} description allowadornment={false} dots={false} menu={menu} displayContext="order" price={false} />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="grid-flex grid-valign-middle">
                    <input type="number" className="quantity" disabled={cartEntry.locked} min={1} max={99} onChange={(e) => setEntryQuantity(i, e.target.value, false)} onBlur={(e) => setEntryQuantity(i, e.target.value, true)} />
                    <span className="cart-item-remove">
                      <button disabled={cartEntry.locked} name="remove" onClick={() => setRemoveEntry(i)} className="button-remove">X</button>
                    </span>
                    {cartEntry.can_edit ?
                      <span className="cart-item-remove">
                        <button name="edit" disabled={isProductEditDialogOpen} onClick={() => setProductToEdit(cartEntry)} className="button-sml">
                          <div className="icon-pencil" />
                        </button>
                      </span> : ""}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
};

WOrderCart.propTypes = {
  menu: PropTypes.any.isRequired,
  cart: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.instanceOf(CartEntry).isRequired).isRequired).isRequired,
  isProductEditDialogOpen: PropTypes.bool.isRequired
};

function WCheckoutCart({ menu, cart, service, creditResponse, totals }: InferProps<typeof WCheckoutCart.propTypes>) {
  const linearCart = useMemo(() => GenerateLinearCart(cart), [cart]);
  return (
    <div className="cart">
      <div className="content border-bottom border-none-at-medium">
        <table className="cart-table table-collapse-until-medium table-border-rows table-pad-line valign-middle header-color">
          <thead>
            <tr>
              <th>Item</th>
              <th className="hide-until-medium">
                <div className="grid-flex grid-valign-middle">
                  <span className="column no-shrink">Quantity</span>
                  <span className="column no-shrink">×</span>
                  <span className="column no-shrink">Price</span>
                </div>
              </th>
              <th className="align-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {linearCart.map((cartEntry: CartEntry, i: number) => (
              <tr key={i} className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="menu-list__item">
                      <WProductComponent product={cartEntry.pi} allowadornment={false} description dots={false} price={false} menu={menu} displayContext="order" />
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap">
                  <div className="grid-flex grid-valign-middle">
                    <span className="column no-shrink menu-list__item-price">{cartEntry.quantity}</span>
                    <span className="column no-shrink">×</span>
                    <span className="column no-shrink menu-list__item-price">{cartEntry.pi.price}</span>
                  </div>
                </td>
                <td className="cart-item-subtotal no-wrap">
                  <span className="menu-list__item-price">{cartEntry.pi.price * cartEntry.quantity}</span>
                </td>
              </tr>
            ))}
            {service === DELIVERY_SERVICE ? (
              <tr className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Delivery Fee<span ng-show="orderCtrl.s.delivery_fee === 0"> (waived)</span></span></h4>
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap"></td>
                <td className="cart-item-subtotal no-wrap">
                  <span className="menu-list__item-price">
                    {totals.deliveryFee === 0 ? <Typography sx={{ textDecoration: "line-through" }}>{fCurrency(5)}</Typography> : <>{fCurrency(totals.deliveryFee)}</>}
                  </span>
                </td>
              </tr>
            ) : ""}
            {creditResponse && creditResponse.validation_successful && creditResponse.type === 'DISCOUNT' ?
              <tr className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Discount Code Applied (<Typography sx={{ textTransform: "none" }}>{creditResponse.code}</Typography>)</span></h4>
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap"></td>
                <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">-{fCurrency(creditResponse.amount_used)}</span></td>
              </tr>
              : ""}
            <tr className="cart-item">
              <td className="cart-item-description">
                <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                  <div className="cart-item-title-subtitle column menu-list__item">
                    <h4 className="menu-list__item-title"><span className="item_title">Sales Tax ({fPercent(TAX_RATE)})</span></h4>
                  </div>
                </div>
              </td>
              <td className="cart-item-quantity-price no-wrap"></td>
              <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(totals.computed_tax)}</span></td>
            </tr>
            {totals.tip_value === 0 ? "" :
              <tr className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Gratuity*</span></h4>
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap"></td>
                <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(totals.tip_value)}</span></td>
              </tr>}
            {creditResponse && creditResponse.validation_successful && creditResponse.type === 'MONEY' ?
              <tr className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Digital Gift Applied ((<Typography sx={{ textTransform: "none" }}>{creditResponse.code}</Typography>)</span></h4>
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap"></td>
                <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">-{fCurrency(creditResponse.amount_used)}</span></td>
              </tr>
              : ""}
            <tr className="cart-item">
              <td className="cart-item-description">
                <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                  <div className="cart-item-title-subtitle column menu-list__item">
                    <h4 className="menu-list__item-title"><span className="item_title">Total</span></h4>
                  </div>
                </div>
              </td>
              <td className="cart-item-quantity-price no-wrap"></td>
              <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(totals.balance)}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

WCheckoutCart.propTypes = {
  menu: PropTypes.any.isRequired,
  cart: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.instanceOf(CartEntry).isRequired).isRequired).isRequired,
  service: PropTypes.number.isRequired,
  creditResponse: CREDIT_RESPONSE_PROPTYPE,
  totals: TOTALS_PROPTYPE
};

class TipSelection {
  isSuggestion: boolean;
  isPercentage: boolean;
  value: number;
  constructor(isSuggestion: boolean, isPercentage: boolean, value: number) {
    this.isSuggestion = isSuggestion;
    this.isPercentage = isPercentage;
    this.value = value;
  }
  computeCashValue(basis: number) {
    return this.isPercentage ? basis * this.value : this.value;
  }
};
const TIP_SUGGESTION_15 = new TipSelection(true, true, 15);
const TIP_SUGGESTION_20 = new TipSelection(true, true, 20);
const TIP_SUGGESTION_225 = new TipSelection(true, true, 225);
const TIP_SUGGESTION_25 = new TipSelection(true, true, 25);
const TIP_SUGGESTION_30 = new TipSelection(true, true, 30);



function WCheckoutStage({ cart, service, service_time, totals, menu, creditResponse }: InferProps<typeof WCheckoutStage.propTypes>) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selected_time_timeout, setSelectedTimeTimeout] = useState(false);
  const tipBasis = useMemo(() => totals.computed_subtotal + totals.deliveryFee + totals.computed_tax, [totals.computed_subtotal, totals.deliveryFee, totals.computed_tax]);
  const [tipUiDirty, setTipUiDirty] = useState(false);
  const [autogratEnabled, setAutogratEnabled] = useState(false);
  const tipSuggestionsArray = useMemo(() => [TIP_SUGGESTION_15, TIP_SUGGESTION_20, TIP_SUGGESTION_25], []);
  const [customTip, setCustomTip] = useState(new TipSelection(false, false, (totals.computed_subtotal + totals.deliveryFee + totals.computed_tax) * TIP_SUGGESTION_20.value));
  const [currentTipSelection, setCurrentTipSelection] = useState<TipSelection | null>(TIP_SUGGESTION_20);
  const [isCustomTipSelected, setIsCustomTipSelected] = useState(false);
  const [storeCreditCode, setStoreCreditCode] = useState("");
  const [orderSubmissionResponse, setOrderSubmissionResponse] = useState({ successful: true, squarePayment: {} });
  const setAndSubmitStoreCreditIfAble = (value: string) => {
    if (creditResponse && !creditResponse.validation_processing) {
      // if complete credit code format
    }
    else {
      setStoreCreditCode(value);
    }
  }
  const setCreditResponse = (response: any) => {

  }
  const submitNoBalanceDue = () => {

  }
  const submitWithSquare = () => {

  }
  const [useCreditCheckbox, setUseCreditCheckbox] = useState(false);
  
  const serviceTimeDisplayString = useMemo(() => GenerateServiceTimeDisplayString(service, service_time), [service, service_time]);
  const setSuggestedTipHandler = (tip: TipSelection) => {
    setTipUiDirty(true);
    setCurrentTipSelection(tip);
    const newTipCashValue = tip.computeCashValue(tipBasis);
    if (customTip.computeCashValue(tipBasis) < newTipCashValue) {
      setCustomTip(new TipSelection(false, false, newTipCashValue));
    }
  }
  const setCustomTipHandler = (value: string, correctInvalid: boolean) => {
    if (autogratEnabled) {

    } else {

    }
  }
  if (!isProcessing) {
    if (!orderSubmissionResponse) {
      return (
        <div>
          <h3 className="flush--top">Add gratuity to your order and settle up!</h3>
          <h5>{TIP_PREAMBLE}</h5>
          <div className="flexbox">
            {tipSuggestionsArray.map((tip: TipSelection, i: number) =>
              <div className="flexbox__item one-third soft-quarter">
                <button onClick={() => { setTipUiDirty(true); setCurrentTipSelection(tip) }} className={`btn tipbtn flexbox__item one-whole${currentTipSelection === tip ? ' selected' : ''}`} >
                  <h3 className="flush--bottom">{fPercent(tip.value)}</h3>
                  <h5 className="flush--top">{fCurrency(tip.computeCashValue(tipBasis))}</h5>
                </button>
              </div>
            )}
          </div>
          <div className="flexbox">
            <div className="flexbox__item one-third soft-quarter" >
              <button onClick={() => setIsCustomTipSelected(true)} className={`btn tipbtn flexbox__item one-whole${isCustomTipSelected ? " selected" : ""}`} >
                <h3 className="flush">Custom Tip Amount</h3>
                {isCustomTipSelected ? <input value={customTip.value} onChange={(e) => setCustomTipHandler(e.target.value, false)} onBlur={(e) => setCustomTipHandler(e.target.value, true)} type="number" className="quantity" min={0} /> : ""}
              </button>
            </div>
          </div>
          <WCheckoutCart cart={cart} service={service} totals={totals} creditResponse={creditResponse} />
          {selected_time_timeout ? <div className="wpcf7-response-output wpcf7-mail-sent-ng">The previously selected service time has expired. We've updated your service time to {serviceTimeDisplayString}.</div> : ""}
          {creditResponse && creditResponse.validation_fail ? <div className="wpcf7-response-output wpcf7-mail-sent-ng">Code entered looks to be invalid. Please check your input and try again. Please copy/paste from the e-mail you received. Credit codes are case sensitive.</div> : ""}
          <div className="flexbox">
            <h4 className="flexbox__item one-whole">Payment Information:</h4>
          </div>
          <div className="soft-half">
            <div className="flexbox">
              <FormControlLabel
                className='flexbox__item'
                control={<Checkbox checked={useCreditCheckbox} onChange={(e) => setUseCreditCheckbox(e.target.checked)} />}
                label="Use Digital Gift Card / Store Credit"
              />
            </div>
            {useCreditCheckbox ?
              <div className="flexbox">
                <div className="flexbox__item one-tenth"><label htmlFor="store_credit_code">Code:</label></div>
                <div className="flexbox__item soft-half--left three-quarters">
                  <span className="float--right">
                    <StoreCreditInputComponent disabled={creditResponse && (creditResponse.validation_successful || creditResponse.validation_processing)} size="20" value={storeCreditCode} disabled onChange={(e) => setAndSubmitStoreCreditIfAble(e.target.value)} />
                  </span>
                </div>
                <div className="flexbox__item soft-half--left">
                  <span className={creditResponse?.validation_successful ? "icon-check-circle" : (creditResponse?.validation_fail ? "icon-exclamation-circle" : "")} />
                </div>
              </div> : ""}
          </div>
          <div>
            {totals.balance === 0 ? "" : <SquarePaymentForm />}
            <div>Note: Once orders are submitted, they are non-refundable. We will attempt to make any changes requested, but please do your due diligence to check the order for correctness!</div>
            <div className="order-nav" ng-show="orderCtrl.s.stage === 6">
              <button type="submit" className="btn" disabled={isProcessing} ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
              <button ng-show="orderCtrl.s.balance > 0" id="sq-creditcard" className="btn" ng-click="orderCtrl.ScrollTop(); submitForm()" ng-disabled="orderCtrl.s.isProcessing">Pay and submit order!</button>
              <button ng-show="orderCtrl.s.balance == 0" className="btn" ng-click="orderCtrl.ScrollTop(); orderCtrl.SubmitToWario()" ng-disabled="orderCtrl.s.isProcessing">Pay and submit order!</button>
            </div>
            <div ng-hide="orderCtrl.s.tip_value === 0">* Gratuity is distributed in its entirety to front and back of house.</div>
          </div>
        </div>);
    }
    else {
      // case: we've got an orderSubmissionResponse and it's done processing, show the results
      if (orderSubmissionResponse.successful) {
        return <div>
          <div className="submitsuccess wpcf7-response-output wpcf7-mail-sent-ok">Order submitted successfully! Please check your email.</div>
          {orderSubmissionResponse.squarePayment.success ? <div>
            Payment of ${fCurrency(orderSubmissionResponse.squarePayment.money_charged / 100)} received from card ending in: {orderSubmissionResponse.squarePayment.last4}!
            Here's your <Link href={orderSubmissionResponse.squarePayment.receipt_url} target="_blank" rel="noopener">receipt</Link>.
          </div> : ""}
          {creditResponse?.validation_successful && creditResponse.amount_used > 0 ? (<div>
            Digital Gift Card number {creditResponse.code} debited ${fCurrency(creditResponse.amount_used)}.
            <span>{creditResponse.amount_used === creditResponse.amount ? "No balance remains." : `Balance of ${fCurrency(creditResponse.amount - creditResponse.amount_used)} remains.`}</span>
          </div>) : ""}
        </div>
      }
      else {
        return (
          <div>
            <div className="wpcf7-response-output wpcf7-validation-errors" >We had some issues processing your order. Please send us a text message or email so we can look into it.</div>
          </div>);
      }
    }
  }
  // case: it's processing... show that we're waiting on the results
  return (<div className="wpcf7 wpcf7-response-output wpcf7-mail-sent-ok">
    Submitting order! This can take a few seconds.<span className="ajax-loader"></span>
  </div>);
}

WCheckoutStage.propTypes = {
  menu: PropTypes.any,
  cart: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.instanceOf(CartEntry).isRequired).isRequired).isRequired,
  service: PropTypes.number.isRequired,
  service_time: PropTypes.number.isRequired,
  creditResponse: CREDIT_RESPONSE_PROPTYPE,
  totals: TOTALS_PROPTYPE
};

function WReviewOrderStage({ cart, service, totals, creditResponse, customerInfo, services, fulfillmentInfo } : InferProps<typeof WReviewOrderStage.propTypes>) {
  const serviceTimeDisplayString = useMemo(() => GenerateServiceTimeDisplayString(service, service_time), [service, fulfillmentInfo.service_time]);
  return (
    <div ng-show="orderCtrl.s.stage === 5 && !orderCtrl.s.isProcessing">
      <h3 className="flush--top">Everything look right?</h3>
      <table>
        <tr>
          <td>Name</td>
          <td>{customerInfo.customer_name_first} {customerInfo.customer_name_last}</td>
        </tr>
        <tr>
          <td>Mobile Number</td>
          <td>{customerInfo.phone_number}</td>
        </tr>
        <tr>
          <td>E-Mail</td>
          <td>{customerInfo.email_address}</td>
        </tr>
        <tr>
          <td>Service</td>
          <td>{services[service]} on {fulfillmentInfo.date_string} at {serviceTimeDisplayString}</td>
        </tr>
        <tr ng-if="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY">
          <td>Address</td>
          <td>{{ orderCtrl.s.validated_delivery_address }}{{ orderCtrl.s.delivery_address_2 ? ", " + orderCtrl.s.delivery_address_2 : "" }}</td>
        </tr>
        <tr ng-if="orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN">
          <td>Party Size</td>
          <td>{{ orderCtrl.s.number_guests }}</td>
        </tr>
      </table>
      <WCheckoutCart cart={cart} service={service} totals={totals} creditResponse={creditResponse} />
      <div ng-show="orderCtrl.s.service_type !== orderCtrl.CONFIG.DELIVERY && !orderCtrl.s.credit.validation_successful">
        <label><input type="checkbox" ng-model="orderCtrl.s.acknowledge_instructions_dialogue" ng-change="orderCtrl.ClearSpecialInstructions()">
          I need to specify some special instructions (which may delay my order or change its cost).</label>
        <textarea ng-show="orderCtrl.s.acknowledge_instructions_dialogue" ng-model="orderCtrl.s.special_instructions" ng-change="orderCtrl.ChangedEscapableInfo()"></textarea>
      </div>
      <div ng-repeat="res in orderCtrl.s.special_instructions_responses" className="wpcf7-response-output wpcf7-validation-errors">{{ res }}</div>
      <div className="order-nav">
        <button type="submit" className="btn" ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
        <button type="submit" className="btn" ng-show="orderCtrl.HasNextStage() && (!orderCtrl.s.acknowledge_instructions_dialogue && !(orderCtrl.s.service_type === orderCtrl.CONFIG.DINEIN && !orderCtrl.CONFIG.ENABLE_DINE_IN_PREPAYMENT))" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage();">Next</button>
        <button type="submit" className="btn" ng-disabled="orderCtrl.s.disableorder" ng-show="orderCtrl.s.acknowledge_instructions_dialogue || (orderCtrl.s.service_type === orderCtrl.CONFIG.DINEIN && !orderCtrl.CONFIG.ENABLE_DINE_IN_PREPAYMENT)" ng-click="orderCtrl.ScrollTop(); orderCtrl.SubmitToWario()">Submit Order</button>
      </div>
    </div>
  )
}
function WCustomerInformationStage({ }) {
  return (
    <div ng-show="orderCtrl.s.stage === 4">
      <h3 className="flush--top">Tell us a little about you.</h3>
      All information is used solely to facilitate the getting of your pizza to you. We don't sell or share customer information, ever.
      <div className="wpcf7-response-output wpcf7-mail-sent-ng" ng-if="orderCtrl.s.submit_failed">There was an error submitting your order. This is generally caused by a bad email address. Please check your information and try again.</div>
      <form name="stage3">
        <span className="flexbox">
          <span className="flexbox__item one-half">
            <label for="customer_name_first">
              <span className="customer-name-text">First Name:</span>
            </label>
            <input type="text" name="fname" id="customer_name_first" size="40" ng-model="orderCtrl.s.customer_name_first" ng-change="orderCtrl.ChangedContactInfo()" autocomplete="given-name" required>
          </span>
          <span className="flexbox__item one-half soft-half--left">
            <label for="customer_name_last">
              <span className="customer-name-text">Family Name:</span>
            </label>
            <input type="text" name="lname" id="customer_name_last" size="40" ng-model="orderCtrl.s.customer_name_last" ng-change="orderCtrl.ChangedContactInfo()" autocomplete="family-name" required>
          </span>
        </span>
        <label for="mobilenum">
          <span className="phone-number-text">Mobile Phone Number:</span>
        </label>
        <span className="phonenum">
          <input jqmaskedphone type="tel" id="mobilenum" name="phone_number" value="" size="40" ng-model="orderCtrl.s.phone_number" ng-change="orderCtrl.ChangedContactInfo()" autocomplete="tel" required>
        </span>
        <label for="user_email">
          <span className="user-email-text">E-mail Address:</span>
        </label>
        <span className="user-email">
          <input type="email" name="user_email" id="user_email" value="" size="40" ng-model="orderCtrl.s.email_address" ng-change="orderCtrl.ChangedContactInfo()" ng-pattern="orderCtrl.s.EMAIL_REGEX" autocomplete="email" required>
        </span>
        <div className="user-email-tip"></div>
        <label for="referral_info">
          <span className="referral-text">Referral information:</span>
        </label>
        <span className="referral-info">
          <input type="text" name="referral_info" id="referral_info" value="" size="40" ng-model="orderCtrl.s.referral" ng-change="orderCtrl.ChangedEscapableInfo()">
        </span>
      </form>
      <div className="order-nav">
        <button type="submit" className="btn" ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
        <button type="submit" className="btn" ng-disabled="!stage3.$valid || orderCtrl.s.submit_failed" ng-show="orderCtrl.HasNextStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage()">{{(!stage3.$valid || orderCtrl.s.submit_failed) ? "Fill out above" : "Next"}}</button>
      </div>
    </div>
  )
}
function WShopForProductsStage({ }) {
  const [selection, setSelection] = useState(null);

  return (
    <div>
      { if <div className="ordering-menu menu-list menu-list__dotted" ng-show="orderCtrl.s.stage === 2 && !pmenuCtrl.selection">
        <h3 className="flush--top" ng-if="orderCtrl.s.num_pizza === 0"><strong>Click a pizza below to get started</strong></h3>
        <h3 className="flush--top" ng-if="orderCtrl.s.num_pizza > 0"><strong>Click a pizza below or next to continue</strong></h3>
        <ul className="flexitems menu-list__items">
          <li className="flexitem menu-list__item" ng-repeat="pizza in pmenuCtrl.CONFIG.MENU.categories[pmenuCtrl.CONFIG.PIZZAS_CATID].menu | filter:orderCtrl.FilterProducts(pmenuCtrl.CONFIG.MENU) | orderBy:'display_flags.order.ordinal'">
            <div className="offer-link" ng-click="orderCtrl.ScrollTop(); orderCtrl.SelectProduct(pmenuCtrl.CONFIG.PIZZAS_CATID, pizza, pmenuCtrl)">
              <wcppizzacartitem prod="pizza" description="true" allowadornment="true" menu="pmenuCtrl.CONFIG.MENU" displayctx="order" dots="true" price="true"></wcppizzacartitem>
            </div>
          </li>
        </ul>
      </div>
      <div ng-show="orderCtrl.s.stage === 3 && !pmenuCtrl.selection">
        <h3 className="flush--top"><strong>Add small plates or beverages to your order.</strong></h3>
        <div className="ordering-menu menu-list menu-list__dotted md-accordion" ng-repeat="subcatid in pmenuCtrl.CONFIG.EXTRAS_CATEGORIES">
          <md-toolbar ng-attr-id="{{ 'accordion-' + subcatid }}" ng-click="orderCtrl.toggleAccordion($index); orderCtrl.ScrollToID('#accordion-' + subcatid, 300);" role="button">
            <div className="md-toolbar-tools">
              <h2>
                <span><strong><span ng-bind-html="pmenuCtrl.CONFIG.MENU.categories[subcatid].menu_name | TrustAsHTML"></span></strong></span>
              </h2>
              <span flex="" className="flex"></span>
              <span ng-className="{expandCollapse:true, active:orderCtrl.s.accordionstate[$index]}"></span>
            </div>
          </md-toolbar>
          <ul ng-className="{dataContent:true, activeContent:orderCtrl.s.accordionstate[$index]}" className="menu-list__items">
            <li className="menu-list__item" ng-if="pmenuCtrl.CONFIG.MENU.categories[subcatid].subtitle"><strong><span ng-bind-html="pmenuCtrl.CONFIG.MENU.categories[subcatid].subtitle | TrustAsHTML"></span></strong></li>
            <li className="menu-list__item" ng-repeat="extra in pmenuCtrl.CONFIG.MENU.categories[subcatid].menu | filter:orderCtrl.FilterProducts(pmenuCtrl.CONFIG.MENU) | orderBy:'display_flags.order.ordinal'">
              <div className="offer-link" ng-click="orderCtrl.SelectProduct(subcatid, extra, pmenuCtrl)">
                <wcppizzacartitem prod="extra" allowadornment="true" description="true" dots="true" price="true" menu="pmenuCtrl.CONFIG.MENU" displayctx="order"></wcppizzacartitem>
            </li>
          </ul>
        </div>
      </div >
      <div className="customizer menu-list__items" ng-if="pmenuCtrl.selection">
        <div style="visibility: hidden">
          <div className="md-dialog-container customizer" id="wcpoptionmodal">
            <md-dialog wcpoptiondetailmodaldir optionctrl="pmenuCtrl.advanced_option"></md-dialog>
          </div>
        </div>
        <h3 className="flush--top"><strong>Customize {{ pmenuCtrl.selection.PRODUCT_CLASS.display_flags && pmenuCtrl.selection.PRODUCT_CLASS.display_flags.singular_noun ? "your " + pmenuCtrl.selection.PRODUCT_CLASS.display_flags.singular_noun : "it" }}!</strong></h3>
        <div className="menu-list__item">
          <wcppizzacartitem prod="pmenuCtrl.selection" description="true" dots="true" price="true" menu="pmenuCtrl.CONFIG.MENU" displayctx="order"></wcppizzacartitem>
        </div>
        <hr className="separator">
          <div wcpmodifierdir ng-repeat="(mtid, value) in pmenuCtrl.FilterModifiers(pmenuCtrl.selection.modifier_map)" mtid="mtid" selection="pmenuCtrl.selection" pmenuctrl="pmenuCtrl" config="orderCtrl.CONFIG">
          </div>
          <div ng-if="!pmenuCtrl.suppress_guide && pmenuCtrl.messages.length">
            <div className="wpcf7-response-output wpcf7-validation-errors" ng-repeat="msg in pmenuCtrl.messages">{{ msg }}</div>
          </div>
          <div ng-if="pmenuCtrl.errors.length">
            <div className="wpcf7-response-output" ng-repeat="msg in pmenuCtrl.errors">{{ msg }}</div>
          </div>
          <div ng-if="orderCtrl.s.enable_split_toppings && pmenuCtrl.selection.advanced_option_eligible"><label><input ng-disabled="pmenuCtrl.selection.advanced_option_selected" type="checkbox" ng-model="pmenuCtrl.allow_advanced">
            I desperately need to order a split topping pizza and I know it's going to be a bad value and bake poorly.</label></div>
          <div className="order-nav">
            <span className="one-fifth">
              <button name="remove" className="btn button-remove" ng-click="orderCtrl.ScrollTop(); pmenuCtrl.UnsetProduct()">Cancel</button>
            </span>
            <span className="four-fifths">
              <span className="order-nav-item float--right">
                <button ng-disabled="pmenuCtrl.errors.length || pmenuCtrl.selection.incomplete" ng-if="pmenuCtrl.is_addition" name="add" className="btn" ng-click="orderCtrl.ScrollTop(); orderCtrl.AddToOrder(pmenuCtrl.catid, pmenuCtrl.selection); pmenuCtrl.UnsetProduct()">Add to order</button>
                <button ng-disabled="pmenuCtrl.errors.length || pmenuCtrl.selection.incomplete" ng-if="!pmenuCtrl.is_addition" name="save" className="btn" ng-click="orderCtrl.ScrollTop(); orderCtrl.UpdateOrderEntry(pmenuCtrl.cart_entry, pmenuCtrl.selection); pmenuCtrl.UnsetProduct()">Save Changes</button>
              </span>
            </span>
          </div>
      </div>
      <WOrderCart />

      <div className="order-nav" ng-hide="pmenuCtrl.selection">
        <h5 className="order-nav-item float--right" ng-if="orderCtrl.s.num_pizza === 0 && orderCtrl.s.stage === 1">First, click on an item above to add it to your order</h5>
        <button type="submit" className="btn" ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
        <button type="submit" className="btn" ng-disabled="orderCtrl.s.num_pizza === 0" ng-show="orderCtrl.HasNextStage() && orderCtrl.s.num_pizza >= 1" ng-click="orderCtrl.ScrollTop(); pmenuCtrl.UnsetProduct(); orderCtrl.NextStage()">Next</button>
      </div>
    </div>
  )
}

function WServiceDateTimeSelectionStage({ services }) {
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [hasAgreedToTerms, setHasAgreedToTerms] = useState(false);
  const canSelectService = useCallback((service: number) => true, []);
  const updateSelectedService = (selection: number) => {
    setSelectedService(selection);
  };

  return (<>
    <span>Requested Service:</span>
    <FormControl>
      <FormLabel id="service-selection-radio-buttons-label">Requested Service:</FormLabel>
      <RadioGroup row aria-labelledby="service-selection-radio-buttons-label" value={selectedService} onChange={(event: React.ChangeEvent<HTMLInputElement>, value: string) => updateSelectedService(Number(value))}>
        {services.map((serviceName: string, i: number) =>
          <FormControlLabel disabled={!canSelectService(i)} key={i} value={i} control={<Radio />} label={serviceName} />
        )}
      </RadioGroup>
    </FormControl>
    {getTermsForService(selectedService).length ?
      <span>
        <br />
        <FormControlLabel control={
          <><Checkbox value={hasAgreedToTerms} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHasAgreedToTerms(e.target.checked)} />

          </>} label={
            <>
              REQUIRED: For the health and safety of our staff and fellow guests, you and all members of your party understand and agree to:
              <ul>
                {getTermsForService(selectedService).map((term: string) => <li>{term}</li>)}
              </ul>
            </>
          } />
      </span> : ""}

    <label for="service-date">
      <span className="service-date-text">Date</span>
    </label>
    <span className="service-date">
      <input type="text" name="service-date" id="service-date" value="" size="40" ng-model="orderCtrl.s.date_string" ng-change="orderCtrl.ValidateDate()" jqdatepicker orderinfo="orderCtrl" required autocomplete="off">
    </span>
    <label for="service-time">
      <span className="service-time-text">Time</span>
    </label>
    <span className="service-time">
      <select ng-disabled="!orderCtrl.s.date_valid" id="service-time" name="service-time" ng-model="orderCtrl.s.service_time" ng-options="servicetime | MinutesToPrintTime:orderCtrl.s.service_type for servicetime in orderCtrl.s.service_times" ng-change="orderCtrl.ServiceTimeChanged()">
      </select>
    </span>
    <div className="wpcf7-response-output wpcf7-mail-sent-ng" ng-if="orderCtrl.s.selected_time_timeout">The previously selected service time has expired.</div>
    <span ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN">
      <label for="guest-count">
        <span className="guest-count-text">Party Size</span>
      </label>
      <span className="guest-count">
        <select name="guest-count" id="guest-count" ng-model="orderCtrl.s.number_guests" ng-options="value for value in [] | Range:orderCtrl.CONFIG.MAX_PARTY_SIZE" ng-change="orderCtrl.fix_number_guests(false)"></select>
      </span>
    </span>
    <span className="flexbox" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && !orderCtrl.s.is_address_validated">
      <span className="flexbox__item one-whole">Delivery Information:</span>
    </span>
    <span className="flexbox" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && !orderCtrl.s.is_address_validated">
      <span className="flexbox__item one-half">
        <label for="address-line1">
          <span className="delivery-address-text">Address:</span>
        </label>
        <input type="text" name="address" id="address-line1" size="40" ng-model="orderCtrl.s.delivery_address" autocomplete="shipping address-line1" address>
      </span>
      <span className="flexbox__item one-quarter soft-half--sides">
        <label for="address-line2">
          <span className="delivery-address-text">Apt/Unit:</span>
        </label>
        <input type="text" name="address-line2" size="10" id="address-line2" ng-model="orderCtrl.s.delivery_address_2" autocomplete="shipping address-line2">
      </span>
      <span className="flexbox__item one-quarter">
        <label for="zipcode" >
          <span className="delivery-zipcode-text">Zip Code:</span>
        </label>
        <span className="zipcode">
          <input type="text" name="zipcode" id="zipcode" size="10" ng-model="orderCtrl.s.delivery_zipcode" autocomplete="postal-code" zipcode>
        </span>
      </span>
    </span>
    <span className="flexbox" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY">
      <span className="flexbox__item one-whole">
        <label for="delivery-instructions-text">
          <span className="delivery-instructions-text">Delivery Instructions (optional):</span>
        </label>
        <input type="text" id="delivery-instructions-text" name="delivery_instructions" size="40" ng-model="orderCtrl.s.delivery_instructions" ng-change="orderCtrl.ChangedEscapableInfo()">
      </span>
    </span>
    <button type="submit" className="btn" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && !(stage1.address.$error.address || stage1.zipcode.$error.zipcode) && !orderCtrl.s.is_address_validated" ng-click="orderCtrl.ValidateDeliveryAddress()">Validate Delivery Address</button>
    <span ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && orderCtrl.s.validated_delivery_address" className="">
      <div className="wpcf7-response-output wpcf7-mail-sent-ok" ng-show="orderCtrl.s.is_address_validated">
        Found an address in our delivery area: <br />
        <span className="title cart">{{ orderCtrl.s.validated_delivery_address }} <button name="remove" ng-click="orderCtrl.ClearAddress()" className="button-remove">X</button></span>
      </div>
      <div className="wpcf7-response-output wpcf7-mail-sent-ng" ng-show="!orderCtrl.s.is_address_validated">The address {{ orderCtrl.s.validated_delivery_address }} isn't in our <a target="_blank" ng-href="{{orderCtrl.CONFIG.DELIVERY_LINK}}">delivery area</a></div>
    </span>
    <div className="wpcf7-response-output wpcf7-mail-sent-ng" ng-show="orderCtrl.s.address_invalid">Unable to determine the specified address. Send us a text or email if you continue having issues.</div>
    <span ng-show="orderCtrl.s.service_type === orderCtrl.CONFIG.PICKUP && orderCtrl.CONFIG.ALLOW_SLICING">
      <br /><label><input type="checkbox" ng-model="orderCtrl.s.slice_pizzas">
        Please slice my pizzas (not recommended)</label>
      <span ng-show="orderCtrl.s.slice_pizzas">Crust, like any good bread, should be given time to rest after baking. Slicing your pizzas as they come out of the oven also causes the trapped moisture at the top of the pizza to permiate the crust itself. If you do stick with this option, we'd recommend crisping up your slice on a hot skillet, as needed.</span>
    </span>
    <div className="order-nav">
      <button type="submit" className="btn" ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
      <button type="submit" className="btn" ng-disabled="!orderCtrl.s.date_valid || (orderCtrl.CONFIG.TERMS_LIST[orderCtrl.s.service_type].length > 0 && !orderCtrl.s.acknowledge_terms) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY && (!orderCtrl.s.is_address_validated)) || (orderCtrl.s.service_type == orderCtrl.CONFIG.DINEIN && (Number.isNaN(orderCtrl.s.number_guests) || orderCtrl.s.number_guests < 1 || orderCtrl.s.number_guests > orderCtrl.CONFIG.MAX_PARTY_SIZE))" ng-show="orderCtrl.HasNextStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.NextStage(); orderCtrl.ClearTimeoutFlag();">Next</button>
    </div>
  </div>
    </>);
}



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