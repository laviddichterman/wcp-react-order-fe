import { Typography, Table, TableBody, TableContainer, TableRow, TableHead, TableCell, Paper } from '@mui/material';
import { ProductDisplay } from './WProductComponent';
import { CartEntry } from '@wcp/wcpshared';
import { fCurrencyNoUnit, fPercent } from '../utils/numbers';
import { DELIVERY_SERVICE } from '../config';
import { useAppSelector } from '../app/useHooks';
import { getCart } from '../app/slices/WCartSlice';
import { SelectBalanceAfterCredits, SelectDeliveryFee, SelectDiscountApplied, SelectGiftCardApplied, SelectTaxAmount, SelectTaxRate, SelectTipValue } from '../app/store';
import { ProductPrice, ProductTitle } from './styled/styled';


export function WCheckoutCart() {
  const menu = useAppSelector(s => s.ws.menu);
  const cart = useAppSelector(s => getCart(s.cart.cart));
  const TAX_RATE = useAppSelector(SelectTaxRate);
  const discountApplied = useAppSelector(SelectDiscountApplied);
  const deliveryFee = useAppSelector(SelectDeliveryFee);
  const tipValue = useAppSelector(SelectTipValue);
  const taxValue = useAppSelector(SelectTaxAmount);
  const giftCardApplied = useAppSelector(SelectGiftCardApplied);
  const balanceAfterCredits = useAppSelector(SelectBalanceAfterCredits);
  const storeCreditCode = useAppSelector(s => s.payment.storeCreditInput);

  const selectedService = useAppSelector(s => s.fulfillment.selectedService) as number;
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
          {cart.map((cartEntry: CartEntry, i: number) => (
            <TableRow key={i}>
              <TableCell>
                <ProductDisplay productMetadata={cartEntry.product.m} menuModifiers={menu.modifiers} description displayContext="order" />
              </TableCell>
              <TableCell><ProductPrice>{cartEntry.quantity}</ProductPrice></TableCell>
              <TableCell><ProductPrice>×</ProductPrice></TableCell>
              <TableCell align="right"><ProductPrice>{cartEntry.product.m.price}</ProductPrice></TableCell>
              <TableCell align="right"><ProductPrice>{cartEntry.product.m.price * cartEntry.quantity}</ProductPrice></TableCell>
            </TableRow>
          ))}
          <TableRow />
          {selectedService === DELIVERY_SERVICE && (
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
          )}
          {discountApplied !== 0 &&
            <TableRow>
              <TableCell colSpan={3} >
                <ProductTitle>Discount Code Applied <Typography sx={{ textTransform: "none" }}>({storeCreditCode})</Typography></ProductTitle>
              </TableCell>
              <TableCell colSpan={2} align="right"><ProductPrice>-{fCurrencyNoUnit(discountApplied)}</ProductPrice></TableCell>
            </TableRow>}
          {taxValue > 0 &&
            <TableRow>
              <TableCell colSpan={3} >
                <ProductTitle>Sales Tax ({fPercent(TAX_RATE)})</ProductTitle>
              </TableCell>
              <TableCell colSpan={2} align="right"><ProductPrice>{fCurrencyNoUnit(taxValue)}</ProductPrice></TableCell>
            </TableRow>}
          {tipValue > 0 &&
            <TableRow>
              <TableCell colSpan={3} >
                <ProductTitle>Gratuity*</ProductTitle>
                <div>Gratuity is distributed in its entirety to non-owner staff working on the day of your order.</div>
              </TableCell>
              <TableCell colSpan={2} align="right"><ProductPrice>{fCurrencyNoUnit(tipValue)}</ProductPrice></TableCell>
            </TableRow>}
          {giftCardApplied > 0 &&
            <TableRow>
              <TableCell colSpan={3} >
                <ProductTitle>Digital Gift Applied <Typography sx={{ textTransform: "none" }}>({storeCreditCode})</Typography></ProductTitle>
              </TableCell>
              <TableCell colSpan={2} align="right">
                <ProductPrice >-{fCurrencyNoUnit(giftCardApplied)}</ProductPrice>
              </TableCell>
            </TableRow>}
          <TableRow>
            <TableCell colSpan={3} >
              <ProductTitle>Total</ProductTitle>
            </TableCell>
            <TableCell colSpan={2} align="right"><ProductPrice>{fCurrencyNoUnit(balanceAfterCredits)}</ProductPrice></TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  </>
  )
}