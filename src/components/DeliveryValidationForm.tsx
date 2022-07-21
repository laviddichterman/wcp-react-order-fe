import { Clear } from '@mui/icons-material';
import { Button, IconButton, Link } from '@mui/material';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { FormProvider, RHFTextField } from './hook-form';
import { DELIVERY_LINK } from '../config';

import { DeliveryInfoRHFSchema, deliveryAddressSchema, setDeliveryInfo, validateDeliveryAddress } from '../app/slices/WFulfillmentSlice';


function useDeliveryInfoForm() {
  const preExisitingDeliveryInfo = useAppSelector(s => s.fulfillment.deliveryInfo);
  const useFormApi = useForm<DeliveryInfoRHFSchema>({
    defaultValues: {
      address: preExisitingDeliveryInfo?.address ?? "",
      address2: preExisitingDeliveryInfo?.address2 ?? "",
      deliveryInstructions: preExisitingDeliveryInfo?.deliveryInstructions ?? "",
      zipcode: preExisitingDeliveryInfo?.zipcode ?? ""
    },
    resolver: yupResolver(deliveryAddressSchema),
    mode: 'onBlur'
  });

  return useFormApi;
}

export default function DeliveryInfoForm() {
  const dispatch = useAppDispatch();
  const deliveryValidationLoading = useAppSelector(s => s.fulfillment.deliveryValidationStatus);

  const deliveryForm = useDeliveryInfoForm();
  const { handleSubmit, reset, formState: { isValid } } = deliveryForm;
  const validatedDeliveryAddress = useAppSelector(s => s.fulfillment.deliveryInfo?.address);
  const validatedDeliveryAddress2 = useAppSelector(s => s.fulfillment.deliveryInfo?.address2 ?? "");
  const validatedZipcode = useAppSelector(s => s.fulfillment.deliveryInfo?.zipcode);
  const resetValidatedAddress = () => {
    reset();
    dispatch(setDeliveryInfo(null));
  };

  const setDeliveryInfoAndAttemptToValidate = function (formData: DeliveryInfoRHFSchema) {
    console.log(formData);
    if (isValid && deliveryValidationLoading !== 'PENDING') {
      dispatch(validateDeliveryAddress(formData));
    }
  }

  return (
    <>
      <span className="flexbox">
        <span className="flexbox__item one-whole">Delivery Information:</span>
      </span>
      {deliveryValidationLoading === 'VALID' ?
        <div className="wpcf7-response-output wpcf7-mail-sent-ok">
          Found an address in our delivery area: <br />
          <span className="title cart">
            {`${validatedDeliveryAddress}${validatedDeliveryAddress2 ? ` ${validatedDeliveryAddress2}` : ''}, ${validatedZipcode}`}
            <IconButton name="remove" onClick={resetValidatedAddress} className="button-remove"><Clear /></IconButton>
          </span>
        </div>
        :
        <FormProvider methods={deliveryForm}>
          <span className="flexbox">
            <span className="flexbox__item one-half">
              <RHFTextField
                name="address"
                readOnly={deliveryValidationLoading === 'PENDING'}
                autoComplete="shipping address-line1"
                label={<label className="delivery-address-text">Address:</label>}
                placeholder={"Address"}
              />
            </span>
            <span className="flexbox__item one-quarter soft-half--sides">
              <RHFTextField
                name="address2"
                readOnly={deliveryValidationLoading === 'PENDING'}
                autoComplete="shipping address-line2"
                label={<label className="delivery-address-text">Apt/Unit:</label>}
                placeholder={"Apt/Unit"}
              />
            </span>
            <span className="flexbox__item one-quarter">
              <RHFTextField
                name="zipcode"
                readOnly={deliveryValidationLoading === 'PENDING'}
                autoComplete="shipping postal-code"
                label={<label className="delivery-address-text">ZIP Code:</label>}
                placeholder={"ZIP Code"}
              />
            </span>
          </span>
        </FormProvider>
      }
      {deliveryValidationLoading === 'OUTSIDE_RANGE' &&
        <div className="wpcf7-response-output wpcf7-mail-sent-ng">
          The address {validatedDeliveryAddress} isn't in our <Link target="_blank" href={DELIVERY_LINK}>delivery area</Link>
        </div>
      }
      {deliveryValidationLoading === 'INVALID' &&
        <div className="wpcf7-response-output wpcf7-mail-sent-ng">
          Unable to determine the specified address. Send us a text or email if you continue having issues.
        </div>
      }

      <span className="flexbox" ng-show="orderCtrl.s.service_type == orderCtrl.CONFIG.DELIVERY">
        <span className="flexbox__item one-whole">
          <label htmlFor="delivery-instructions-text">
            <span className="delivery-instructions-text">Delivery Instructions (optional):</span>
          </label>
          <input type="text" id="delivery-instructions-text" name="delivery_instructions" size={40} ng-model="orderCtrl.s.delivery_instructions" ng-change="orderCtrl.ChangedEscapableInfo()" />
        </span>
      </span>
      <Button type="submit" disabled={!isValid || deliveryValidationLoading === 'PENDING'} className="btn" onClick={() => handleSubmit((e) => setDeliveryInfoAndAttemptToValidate(e))()}>Validate Delivery Address</Button>
    </>
  )
}

