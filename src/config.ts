// API
// ----------------------------------------------------------------------
import { LicenseInfo } from '@mui/x-license';

export enum STEPPER_STAGE_ENUM {
  TIMING,
  ADD_MAIN_PRODUCT,
  ADD_SUPP_PRODUCT,
  CUSTOMER_INFO,
  REVIEW_ORDER,
  CHECK_OUT
};

export const NUM_STAGES = (Object.keys(STEPPER_STAGE_ENUM).length /2);

export const HOST_API = import.meta.env.VITE_HOST_API_KEY || '';

export const SOCKETIO = {
  ns: import.meta.env.VITE_SOCKETIO_NS as string,
}

LicenseInfo.setLicenseKey(import.meta.env.VITE_MUI_KEY);
