import { Typography, Table, TableBody, TableContainer, TableRow, TableHead, TableCell, Paper } from '@mui/material';
import { WProductComponent } from './WProductComponent';
import { CartEntry } from '@wcp/wcpshared';
import { fCurrencyNoUnit, fPercent } from '../utils/numbers';
import { DELIVERY_SERVICE } from '../config';
import { useAppSelector } from '../app/useHooks';
import { getCart } from '../app/slices/WCartSlice';
import { SelectBalanceAfterCredits, SelectDeliveryFee, SelectDiscountApplied, SelectGiftCardApplied, SelectTaxAmount, SelectTaxRate, SelectTipValue } from '../app/store';


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
  return (
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
                <WProductComponent productMetadata={cartEntry.product.m} allowAdornment={false} description dots={false} price={false} menuModifiers={menu.modifiers} displayContext="order" />
              </TableCell>
              <TableCell>{cartEntry.quantity}</TableCell>
              <TableCell>×</TableCell>
              <TableCell>{cartEntry.product.m.price}</TableCell>
              <TableCell>{cartEntry.product.m.price * cartEntry.quantity}</TableCell>
            </TableRow>
          ))}
          {selectedService === DELIVERY_SERVICE && (
            <TableRow>
              <TableCell>
                Delivery Fee{deliveryFee === 0 && " (waived)"}
              </TableCell>
              <TableCell>
                {deliveryFee === 0 ? <Typography sx={{ textDecoration: "line-through" }}>{fCurrencyNoUnit(5)}</Typography> : <>{fCurrencyNoUnit(deliveryFee)}</>}
              </TableCell>
            </TableRow>
          )}
          {discountApplied !== 0 &&
            <TableRow>
              <TableCell>
                Discount Code Applied (<Typography sx={{ textTransform: "none" }}>{storeCreditCode}</Typography>)
              </TableCell>
              <TableCell></TableCell>
              <TableCell>-{fCurrencyNoUnit(discountApplied)}</TableCell>
            </TableRow>}
          {taxValue > 0 &&
            <TableRow>
              <TableCell>
                Sales Tax ({fPercent(TAX_RATE)})
              </TableCell>
              <TableCell>{fCurrencyNoUnit(taxValue)}</TableCell>
            </TableRow>}
          {tipValue > 0 &&
            <TableRow>
              <TableCell>
                <h4 className="menu-list__item-title">Gratuity*</h4>
                <div>Gratuity is distributed in its entirety to non-owner staff working on the day of your order.</div>
              </TableCell>
              <TableCell>{fCurrencyNoUnit(tipValue)}</TableCell>
            </TableRow>}
          {giftCardApplied > 0 &&
            <TableRow>
              <TableCell>
                Digital Gift Applied ((<Typography sx={{ textTransform: "none" }}>{storeCreditCode}</Typography>)
              </TableCell>
              <TableCell>-{fCurrencyNoUnit(giftCardApplied)}</TableCell>
            </TableRow>}
          <TableRow>
            <TableCell>
              Total
            </TableCell>
            <TableCell>{fCurrencyNoUnit(balanceAfterCredits)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  )
}