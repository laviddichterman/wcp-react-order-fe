import { WCPProduct, WProductMetadata } from '@wcp/wcpshared';
import React from 'react';
import { DELIVERY_SERVICE, PIZZAS_CATID } from '../config';
import { WFulfillmentState } from './WFulfillmentSlice';

export const TIMING_POLLING_INTERVAL = 30000;

export const MAX_PARTY_SIZE = 10;

export const SERVICE_DATE_FORMAT = 'EEEE, MMMM dd, yyyy';
export interface WProduct { 
  p: WCPProduct;
  m: WProductMetadata;
}

export interface CoreCartEntry { 
  categoryId: string;
  quantity: number;
  product: WProduct;
};
export interface CartEntry extends CoreCartEntry { 
  id: string;
  isLocked: boolean;
};
export class TipSelection {
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

const SERVICE_TERMS_LIST = [[], ["All of our party members 5 years of age and up will provide proof (either digital or physical) of full COVID-19 vaccination AND BOOSTER (if eligible) along with matching ID to Windy City Pie upon arrival.",
  "All members of our party consent to an IR temperature check.",
  "All members of our party who have recently had a COVID-19 infection have tested negative on a rapid test since their last infection.",
  "All members of our party will remain masked at all times not eating or drinking.",
  "All members of our party are actively monitoring for any possible COVID-19 symptoms and have not had any.",
  "Our party understands that placing this order is a commitment to pay for the items in the order, even if we cannot consume them due to violation of Windy City Pie's COVID-19 safety protocols.",
  "Our party understands that table reservations last 60 minutes from the time selected below. (We're flexible if there's no one waiting.)",
  "Our full party will arrive at least 15 minutes before the time we select below. We understand the pizza is scheduled to come out of the oven at the time selected below."],
[]];

export const getTermsForService = (service: number) => SERVICE_TERMS_LIST[service]; 

// var FilterModifiersCurry = function (menu) {
//   return function (mods) {
//     var result = {};
//     angular.forEach(mods, function(value, mtid) {
//       var modifier_entry = menu.modifiers[mtid];
//       var disp_flags = modifier_entry.modifier_type.display_flags;
//       var omit_section_if_no_available_options = disp_flags.omit_section_if_no_available_options;
//       var hidden = disp_flags.hidden;
//       // cases to not show:
//       // modifier.display_flags.omit_section_if_no_available_options && (has selected item, all other options cannot be selected, currently selected items cannot be deselected)
//       // modifier.display_flags.hidden is true
//       if (!hidden && (!omit_section_if_no_available_options || value.has_selectable)) {
//         result[mtid] = value;
//       }
//     });
//     return result;
//   };
// }

// var ProductHasSelectableModifiers = function(pi, menu) {
//   return Object.keys(FilterModifiersCurry(menu)(pi.modifier_map)).length > 0;
// }

// export const GenerateLinearCart = (cart: Cart) => {
//   const pizza_portion: CartEntry[] = [];
//   const extras_portion: CartEntry[] = [];
//   Object.entries(cart).forEach(([key, values]: [string, CartEntry[]]) => {
//     values.forEach((entry: CartEntry) => {
//       if (key === PIZZAS_CATID) {
//         pizza_portion.push(entry);
//       }
//       else {
//         extras_portion.push(entry);
//       }
//     })
//   })
//   return pizza_portion.concat(extras_portion);
// }


export type ILINEAR_CART = CartEntry[];

export interface ICREDIT_RESPONSE {
  type: string;
  validation_successful: boolean;
  validation_fail: boolean;
  validation_processing: boolean;
  code: string;
  amount_used: number;
  amount: number;
}

export interface ITOTALS {
  deliveryFee: number;
  balance: number;
  tip_value: number;
  computed_tax: number;
  computed_subtotal: number;
}

export type DeliveryAddress = { formatted_address: string, address2?: string };
export type CustomerInfo = {
  givenName: string,
  familyName: string,
  mobileNum: string,
  email: string,
  referral: string
};

export interface FulfillmentDT { 
  time: number;
  day: Date;
}
export abstract class AOrderFulfillment {
  abstract getType(): number;
  dt: FulfillmentDT;
  constructor(dt : FulfillmentDT) {
    this.dt = dt;
  } 
}

export class PickupOrderFulfillment extends AOrderFulfillment {
  getType(): number {
      return 0;
  }
};

export class DeliveryOrderFulfillment extends AOrderFulfillment {
  getType(): number {
    return 2;
  };
  service_fee: number;
  address: DeliveryAddress;
  instructions: string | null;
  constructor(dt : FulfillmentDT, fee: number, address: DeliveryAddress, instructions: string) {
    super(dt);
    this.service_fee = fee;
    this.address = address;
    this.instructions = instructions;
  }
}

export class DineInOrderFulfillment extends AOrderFulfillment {
  getType(): number {
    return 1;
  };
  partySize: number;
  constructor(dt : FulfillmentDT, partySize: number) {
    super(dt);
    this.partySize = partySize;
  }
}

export type StepNav = (onSubmitCallback: () => void, canNext: boolean, canBack: boolean) => React.ReactNode;

export interface StepData {
  stepperTitle: string;
  content: ({navComp} : {navComp : StepNav}) => React.ReactNode;
}


export type OrderFulfillment = PickupOrderFulfillment | DeliveryOrderFulfillment | DineInOrderFulfillment;


