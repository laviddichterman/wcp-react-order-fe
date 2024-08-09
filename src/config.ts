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

export const HOST_API = process.env.REACT_APP_HOST_API_KEY || '';

export const SOCKETIO = {
  ns: process.env.REACT_APP_SOCKETIO_NS,
}
export const MUI_LICENSE = process.env.REACT_APP_MUI_KEY;
LicenseInfo.setLicenseKey(MUI_LICENSE!);
