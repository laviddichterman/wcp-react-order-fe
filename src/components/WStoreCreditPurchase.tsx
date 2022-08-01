import { useEffect, useState } from 'react';
import { Box, Link, Typography, Grid, FormLabel } from '@mui/material';
import { useAppSelector } from '../app/useHooks';
import { MoneyInput } from './MoneyInput';
import { CURRENCY, IMoney, RoundToTwoDecimalPlaces } from '@wcp/wcpshared';
import * as yup from "yup";
import { YupValidateEmail } from './hook-form/RHFMailTextField';
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { FormProvider, RHFTextField, RHFCheckbox } from './hook-form';
import { RHFMailTextField } from './hook-form/RHFMailTextField';
import { ApplePay, CreditCard, PaymentForm } from 'react-square-web-payments-sdk';
import type * as Square from '@square/web-sdk';
import axiosInstance from '../utils/axios';
import { styled } from '@mui/system';
import { ErrorResponseOutput, SquareButtonCSS } from './styled/styled';
import { SelectSquareAppId, SelectSquareLocationId } from '../app/store';

const CabinTypography = styled(Typography)({
  fontFamily: "Cabin",
});

const Title = styled(CabinTypography)({
  fontWeight: 500,
  fontSize: 19,
  textTransform: 'uppercase'
})

interface CreditPurchaseInfo {
  senderName: string;
  senderEmail: string;
  recipientNameFirst: string;
  recipientNameFamily: string;
  sendEmailToRecipient: boolean;
  recipientEmail: string;
  recipientMessage: string;
}

const creditPurchaseInfoSchema = yup.object().shape({
  senderName: yup.string().ensure().required("Please enter your name.").min(2, "Please enter your full name."),
  senderEmail: YupValidateEmail(yup.string()),
  recipientNameFirst: yup.string().ensure().required("Please enter the given name.").min(2, "Please enter the full name."),
  recipientNameFamily: yup.string().ensure().required("Please enter the family name.").min(2, "Please enter the family name."),
  sendEmailToRecipient: yup.bool().required(),
  recipientEmail: yup.string().when('sendEmailToRecipient', {
    is: true,
    then: (s) => YupValidateEmail(s),
    otherwise: s => s
  }),
  recipientMessage: yup.string()
});


function useCPForm() {
  const useFormApi = useForm<CreditPurchaseInfo>({

    //  seems to be a bug here where this cannot be set?
    defaultValues: {
      senderName: "",
      senderEmail: "",
      recipientNameFirst: "",
      recipientNameFamily: "",
      recipientEmail: "",
      sendEmailToRecipient: true,
      recipientMessage: ""
    },
    resolver: yupResolver(creditPurchaseInfoSchema),
    mode: "onBlur",

  });

  return useFormApi;
}

type PurchaseStatus = 'IDLE' | 'PROCESSING' | 'SUCCESS' | 'FAILED_UNKNOWN' | 'INVALID_DATA';

interface PurchaseResponse {
  reference_id: string;
  joint_credit_code: string;
  square_order_id: string;
  amount_money: number;
  last4: string;
  receipt_url: string;
}

interface PurchaseResponseFailure {
  error: Square.SquareApiError[],
  success: false;
  result: null;
}

const makeRequest = (token: string, amount: number, values: CreditPurchaseInfo) => {
  return axiosInstance.post('api/v1/payments/storecredit/stopgap', {
    nonce: token,
    credit_amount: amount / 100,
    sender_name: values.senderName,
    recipient_name_first: values.recipientNameFirst,
    recipient_name_last: values.recipientNameFamily,
    sender_email_address: values.senderEmail,
    send_email_to_recipient: values.sendEmailToRecipient,
    recipient_email_address: values.recipientEmail,
    recipient_message: values.recipientMessage
  });
}

export function WStoreCreditPurchase() {
  const squareApplicationId = useAppSelector(SelectSquareAppId);
  const squareLocationId = useAppSelector(SelectSquareLocationId);
  const cPForm = useCPForm();
  const { getValues, watch, formState: { isValid, errors } } = cPForm;
  const sendEmailToRecipientState = watch('sendEmailToRecipient');
  const senderName = watch('senderName');
  const recipientNameFirst = watch('recipientNameFirst');
  const [creditAmount, setCreditAmount] = useState<IMoney>({ currency: CURRENCY.USD, amount: 5000 });
  const [purchaseStatus, setPurchaseStatus] = useState<PurchaseStatus>('IDLE');
  const [displayPaymentForm, setDisplayPaymentForm] = useState(false);
  const [purchaseResponse, setPurchaseResponse] = useState<PurchaseResponse | null>(null);
  const [paymentErrors, setPaymentErrors] = useState<string[]>([]);
  useEffect(() => {
    if (isValid) {
      setDisplayPaymentForm(true);
    }
  }, [isValid])
  const cardTokenizeResponseReceived = async (props: Square.TokenResult, verifiedBuyer?: Square.VerifyBuyerResponseDetails) => {
    const formValues = structuredClone(getValues());
    if (purchaseStatus !== 'PROCESSING') {
      setPurchaseStatus('PROCESSING');
      if (props.token) {
        await makeRequest(props.token, creditAmount.amount, formValues).then((response) => {
          setPurchaseResponse(response.data);
          setPurchaseStatus('SUCCESS');
        }).catch((reason: any) => {
          if (reason && reason.error) {
            console.log(reason.error);
            setPurchaseStatus('INVALID_DATA');
            setPaymentErrors((reason as PurchaseResponseFailure).error.map(x => x.detail ?? x.code));
          }
          else {
            setPurchaseStatus('FAILED_UNKNOWN');
          }
        })
      } else if (props.errors) {
        setPaymentErrors(props.errors?.map(x => x.message) ?? ["Unknown Error"])
        setPurchaseStatus('FAILED_UNKNOWN');
      }
    }
  }

  const createPaymentRequest: () => Square.PaymentRequestOptions = () => {
    return {
      countryCode: "US",
      currencyCode: creditAmount.currency,
      total: { label: "Total", amount: RoundToTwoDecimalPlaces(creditAmount.amount / 100).toFixed(2) }
    }
  }
  return (
    <Box sx={{ mx: 'auto', pt: 1 }}>
      <PaymentForm
        applicationId={squareApplicationId}
        locationId={squareLocationId}
        cardTokenizeResponseReceived={cardTokenizeResponseReceived}
        createPaymentRequest={createPaymentRequest}
      >
        {purchaseStatus !== 'SUCCESS' &&
          <FormProvider methods={cPForm} >

            <Grid container justifyContent="center">
              {/* <Grid item sx={{ p: 2 }} xs={12}>
                <Typography variant="body1" align='center'>
                  Use this page to purchase a gift for yourself or a loved one. It never expires and is good at both Windy City Pie and Breezy Town Pizza!
                </Typography>
              </Grid> */}
              <Grid item sx={{ p: 1 }} xs={12}>
                <Typography variant='h4'>
                  Spread pizza,<br />electronically!
                </Typography>
              </Grid>

              <Grid item sx={{ pl: 2, pt: 4, pb: 4 }} xs={4}>
                <FormLabel sx={{ verticalAlign: 'center', alignContent: 'left' }} htmlFor='creditAmount'>
                  <Title>Amount</Title>
                </FormLabel>
              </Grid>
              <Grid item sx={{ pl: 1, pt: 2, pb: 2, pr: 2 }} xs={8}>
                <MoneyInput
                  id="creditAmount"
                  fullWidth
                  label=""
                  autoFocus
                  value={creditAmount.amount / 100}
                  onChange={(e) => setCreditAmount({ ...creditAmount, amount: e * 100 })}
                  parseFunction={parseFloat}
                  inputProps={{ min: 2, max: 2000, sx: { fontFamily: "Cabin" } }} />
              </Grid>
              <Grid item sx={{ p: 1 }} container xs={12}>
                <Grid item xs={12}>
                  <Title>Sender Information:</Title>
                </Grid>
                <Grid item sx={{ p: 1 }} xs={12}>
                  <RHFTextField
                    name="senderName"
                    autoComplete="full-name name"
                    label="Sender's Name:"
                    fullWidth
                    readOnly={purchaseStatus === 'PROCESSING'}
                    inputProps={{ sx: { fontFamily: "Cabin" } }}
                  />
                </Grid>
                <Grid item sx={{ p: 1 }} xs={12}>
                  <RHFMailTextField
                    name="senderEmail"
                    autoComplete={"d"}
                    label={!errors.senderName && senderName !== "" ? `${senderName}'s e-mail address:` : "Sender's e-mail address:"}
                    fullWidth
                    readOnly={purchaseStatus === 'PROCESSING'}
                    inputProps={{ sx: { fontFamily: "Cabin" } }}
                  />
                </Grid>
              </Grid>
              <Grid item sx={{ p: 1 }} container xs={12}>
                <Grid item xs={12}>
                  <Title>Recipient information:</Title>
                </Grid>
                <Grid item sx={{ p: 1, pr: 1 }} xs={6}>
                  <RHFTextField
                    name="recipientNameFirst"
                    autoComplete="given-name name"
                    label={<CabinTypography>Recipient's first name:</CabinTypography>}
                    fullWidth
                    readOnly={purchaseStatus === 'PROCESSING'}
                    inputProps={{ sx: { fontFamily: "Cabin" } }}
                  />
                </Grid>
                <Grid item sx={{ p: 1, pl: 1 }} xs={6}>
                  <RHFTextField
                    name="recipientNameFamily"
                    autoComplete="family-name"
                    label={<CabinTypography>{!errors.recipientNameFirst && recipientNameFirst !== "" ? `${recipientNameFirst}'s family name:` : "Recipient's family name:"}</CabinTypography>}
                    fullWidth
                    readOnly={purchaseStatus === 'PROCESSING'}
                    inputProps={{ sx: { fontFamily: "Cabin" } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <RHFCheckbox
                    readOnly={purchaseStatus === 'PROCESSING'}
                    name="sendEmailToRecipient"
                    label={`Please inform ${!errors.recipientNameFirst && recipientNameFirst !== "" ? recipientNameFirst : 'the recipient'} via e-mail for me!`}
                  />
                </Grid>
                {sendEmailToRecipientState &&
                  <>
                    <Grid item sx={{ p: 1 }} xs={12}>
                      <RHFMailTextField
                        name="recipientEmail"
                        autoComplete=""
                        label={<CabinTypography>{!errors.recipientNameFirst && recipientNameFirst !== "" ? `${recipientNameFirst}'s e-mail address:` : "Recipient's e-mail address:"}</CabinTypography>}
                        fullWidth
                        readOnly={purchaseStatus === 'PROCESSING'}
                        inputProps={{ sx: { fontFamily: "Cabin" } }}
                      />
                    </Grid>
                    <Grid item sx={{ p: 1 }} xs={12}>
                      <RHFTextField
                        name="recipientMessage"
                        multiline
                        label={<CabinTypography>Additional message (optional):</CabinTypography>}
                        inputProps={{ sx: { fontFamily: "Cabin" } }}
                      />
                    </Grid>
                  </>
                }
              </Grid>
              <Grid item sx={{ p: 2 }} xs={12}>
                {displayPaymentForm &&
                  <>
                    <CreditCard
                      // @ts-ignore 
                      focus={""}
                      buttonProps={{ isLoading: purchaseStatus === 'PROCESSING' || !isValid, css: SquareButtonCSS }} />
                    {/* <ApplePay /> */}
                  </>}
                {paymentErrors.length > 0 &&
                  paymentErrors.map((e, i) => <ErrorResponseOutput key={i}>{e}</ErrorResponseOutput>)}
              </Grid>
            </Grid>
          </FormProvider>
        }
        {purchaseStatus === 'SUCCESS' && purchaseResponse !== null &&
          <Grid container>
            <Grid item xs={12}>
              <Typography variant="h3">Payment of {purchaseResponse.amount_money / 100} received
                from card ending in: {purchaseResponse.last4}!</Typography>
              <Typography variant="body2">Here's your <Link href={purchaseResponse.receipt_url} target="_blank">receipt</Link>.</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant='h6'>Store credit details:</Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h4">Credit Amount: </Typography>
              <span>{purchaseResponse.amount_money / 100}</span>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="h4">Recipient: </Typography>
              <span>{getValues('recipientNameFirst')} {getValues('recipientNameFamily')}</span>
            </Grid>
            <Grid item xs={4}>
              <Typography sx={{ fontWeight: 'bold' }}>Credit Code:</Typography>
              <span>{purchaseResponse.joint_credit_code}</span>
            </Grid>
          </Grid>}
      </PaymentForm>
    </Box>
  );
}