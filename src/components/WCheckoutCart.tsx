import { useAppSelector } from '../app/useHooks';
import { CatalogSelectors, WCheckoutCartComponent, selectGroupedAndOrderedCart, SelectTaxRate } from '@wcp/wario-ux-shared';
import { SelectBalanceAfterCredits, SelectDiscountCreditValidationsWithAmounts, SelectGiftCardValidationsWithAmounts, SelectTaxAmount, SelectTipValue } from '../app/store';
import { getCart } from '../app/slices/WCartSlice';
import { CreditPayment, PaymentMethod } from '@wcp/wcpshared';

export function WCheckoutCart() {
  //const ungroupedCart = useAppSelector(s=>getCart(s.cart.cart));
  const cart = useAppSelector(s => selectGroupedAndOrderedCart(s, getCart(s.cart.cart)));
  const submitToWarioResponse = useAppSelector(s => s.payment.warioResponse);
  const TAX_RATE = useAppSelector(SelectTaxRate);
  const catalogSelectors = useAppSelector(s => CatalogSelectors(s.ws));
  const tipValue = useAppSelector(SelectTipValue);
  const taxValue = useAppSelector(SelectTaxAmount);
  const discountCreditsApplied = useAppSelector(SelectDiscountCreditValidationsWithAmounts);
  const giftCreditsApplied = useAppSelector(SelectGiftCardValidationsWithAmounts);
  const balanceAfterCredits = useAppSelector(SelectBalanceAfterCredits);

  const selectedService = useAppSelector(s => s.fulfillment.selectedService);
  if (selectedService === null) {
    return null;
  }
  return <WCheckoutCartComponent
    balanceAfterCredits={balanceAfterCredits} 
    cart={cart} 
    catalogSelectors={catalogSelectors} 
    discountCreditsApplied={discountCreditsApplied.map(x => ({ amount: x.amount_used, code: x.code }))} 
    giftCreditsApplied={giftCreditsApplied.map(x => ({ amount: x.amount_used, code: x.code }))} 
    selectedService={selectedService}
    taxRate={TAX_RATE}
    taxValue={taxValue}
    tipValue={tipValue}
    payments={submitToWarioResponse && submitToWarioResponse.success ? submitToWarioResponse.result.payments.filter(x=>x.t === PaymentMethod.CreditCard) as CreditPayment[] : []}
    />
}