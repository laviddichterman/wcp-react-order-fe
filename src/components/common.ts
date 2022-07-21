import { WProduct } from '@wcp/wcpshared';
import { MetadataJson } from 'libphonenumber-js/core';
import metadata_custom from '../metadata.custom.json';

export const LIBPHONE_METADATA = metadata_custom as unknown as MetadataJson;

export const TIMING_POLLING_INTERVAL = 30000;

export const MAX_PARTY_SIZE = 10;

export const SERVICE_DATE_FORMAT = 'EEEE, MMMM dd, yyyy';

export interface CoreCartEntry { 
  categoryId: string;
  quantity: number;
  product: WProduct;
};
export interface CartEntry extends CoreCartEntry { 
  id: string;
  isLocked: boolean;
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

export type CustomerInfo = {
  givenName: string,
  familyName: string,
  mobileNum: string,
  email: string,
  referral: string
};