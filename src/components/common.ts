import { DELIVERY_SERVICE, PIZZAS_CATID } from '../config';

export class CartEntry {
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

export const getTermsForService = (service: number | null) => service !== null ? SERVICE_TERMS_LIST[service] : [];


export interface Cart {
  [key: string]: CartEntry[];
};

export const GenerateLinearCart = (cart: Cart) => {
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
  email: string
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

export type OrderFulfillment = PickupOrderFulfillment | DeliveryOrderFulfillment | DineInOrderFulfillment;

export const GenerateServiceTimeDisplayString = (fulfillment : OrderFulfillment) => fulfillment.getType() === DELIVERY_SERVICE ? `${fulfillment.dt.time} to later` : `${fulfillment.dt.time}`;
