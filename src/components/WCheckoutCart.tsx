import { Typography, Table, TableBody, TableContainer, TableRow, TableHead, TableCell, Paper } from '@mui/material';
import { ProductDisplay } from './WProductComponent';
import { CartEntry, MoneyToDisplayString } from '@wcp/wcpshared';
import { fPercent } from '../utils/numbers';
import { useAppSelector } from '../app/useHooks';
import { SelectBalanceAfterCredits, SelectServiceFee, SelectDiscountCreditValidationsWithAmounts, SelectGiftCardValidationsWithAmounts, selectGroupedAndOrderedCart, SelectTaxAmount, SelectTaxRate, SelectTipValue } from '../app/store';
import { ProductPrice, ProductTitle } from './styled/styled';

export function WCheckoutCart() {
  const menu = useAppSelector(s => s.ws.menu);
  const cart = useAppSelector(selectGroupedAndOrderedCart);
  const TAX_RATE = useAppSelector(SelectTaxRate);
  // const deliveryFee = useAppSelector(SelectDeliveryFee);
  const tipValue = useAppSelector(SelectTipValue);
  const taxValue = useAppSelector(SelectTaxAmount);
  const discountCreditsApplied = useAppSelector(SelectDiscountCreditValidationsWithAmounts);
  const giftCreditsApplied = useAppSelector(SelectGiftCardValidationsWithAmounts);
  const balanceAfterCredits = useAppSelector(SelectBalanceAfterCredits);

  const selectedService = useAppSelector(s => s.fulfillment.selectedService);
  if (menu === null || selectedService === null) {
    return null;
  }
  return (<>
    <Typography variant="h4" sx={{ p: 2, textTransform: 'uppercase', fontFamily: 'Source Sans Pro', }}>Order summary</Typography>
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell colSpan={3}>Quantity x Price</TableCell>
            <TableCell>Subtotal</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cart.map(x=>x[1].map((cartEntry: CartEntry, i: number) => (
            <TableRow key={cartEntry.id}>
              <TableCell>
                <ProductDisplay productMetadata={cartEntry.product.m} menuModifiers={menu.modifiers} description displayContext="order" />
              </TableCell>
              <TableCell><ProductPrice>{cartEntry.quantity}</ProductPrice></TableCell>
              <TableCell><ProductPrice>×</ProductPrice></TableCell>
              <TableCell align="right"><ProductPrice>{MoneyToDisplayString(cartEntry.product.m.price, false)}</ProductPrice></TableCell>
              <TableCell align="right"><ProductPrice>{MoneyToDisplayString({ currency: cartEntry.product.m.price.currency, amount: Math.round(cartEntry.product.m.price.amount * cartEntry.quantity) }, false)}</ProductPrice></TableCell>
            </TableRow>
          ))).flat()}
          <TableRow />
          {/* {selectedService === DELIVERY_SERVICE && (
            <TableRow>
              <TableCell colSpan={2} >
                <ProductTitle>Delivery Fee{deliveryFee === 0 && " (waived)"}</ProductTitle>
              </TableCell>
              <TableCell />
              <TableCell colSpan={2} align="right">
                <ProductPrice>
                  {deliveryFee === 0 ?
                    <Typography sx={{ textDecoration: "line-through" }}>{fCurrencyNoUnit(5)}</Typography> :
                    <>{fCurrencyNoUnit(deliveryFee)}</>}
                </ProductPrice>
              </TableCell>
            </TableRow>
          )} */}
          {discountCreditsApplied.map(credit => 
            <TableRow key={credit.code}>
              <TableCell colSpan={3} >
                <ProductTitle>Discount Code Applied <Typography sx={{ textTransform: "none" }}>({credit.code})</Typography></ProductTitle>
              </TableCell>
              <TableCell colSpan={2} align="right"><ProductPrice>-{MoneyToDisplayString(credit.amount_used, false)}</ProductPrice></TableCell>
            </TableRow>)}
          {taxValue.amount > 0 &&
            <TableRow>
              <TableCell colSpan={3} >
                <ProductTitle>Sales Tax ({fPercent(TAX_RATE)})</ProductTitle>
              </TableCell>
              <TableCell colSpan={2} align="right"><ProductPrice>{MoneyToDisplayString(taxValue, false)}</ProductPrice></TableCell>
            </TableRow>}
          {tipValue.amount > 0 &&
            <TableRow>
              <TableCell colSpan={3} >
                <ProductTitle>Gratuity*</ProductTitle>
                <div>Gratuity is distributed in its entirety to non-owner staff working on the day of your order.</div>
              </TableCell>
              <TableCell colSpan={2} align="right"><ProductPrice>{MoneyToDisplayString(tipValue, false)}</ProductPrice></TableCell>
            </TableRow>}
          {giftCreditsApplied.map(credit =>
            <TableRow key={credit.code}>
              <TableCell colSpan={3} >
                <ProductTitle>Digital Gift Applied <Typography sx={{ textTransform: "none" }}>({credit.code})</Typography></ProductTitle>
              </TableCell>
              <TableCell colSpan={2} align="right">
                <ProductPrice >-{MoneyToDisplayString(credit.amount_used, false)}</ProductPrice>
              </TableCell>
            </TableRow>)}
          <TableRow>
            <TableCell colSpan={3} >
              <ProductTitle>Total</ProductTitle>
            </TableCell>
            <TableCell colSpan={2} align="right"><ProductPrice>{MoneyToDisplayString(balanceAfterCredits, false)}</ProductPrice></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </>
  )
}