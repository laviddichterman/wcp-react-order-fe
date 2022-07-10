import { Typography, Table, TableBody, TableContainer, TableRow, TableHead, TableCell, Paper } from '@mui/material';
import { WProductComponent } from './WProductComponent';
import { CartEntry } from './common';
import { fCurrency, fPercent } from '../utils/numbers';
import { DELIVERY_SERVICE, TAX_RATE } from '../config';
import useMenu from '../app/useMenu';
import { useAppSelector } from '../app/useHooks';
import { getCart } from './WCartSlice';
import { SelectBalanceAfterCredits, SelectDeliveryFee, SelectDiscountApplied, SelectGiftCardApplied, SelectTaxAmount, SelectTipValue } from '../app/store';


export function WCheckoutCart() {
  const { menu } = useMenu();
  const cart = useAppSelector(s => getCart(s.cart));
  const discountApplied = useAppSelector(SelectDiscountApplied);
  const deliveryFee = useAppSelector(SelectDeliveryFee);
  const tipValue = useAppSelector(SelectTipValue);
  const taxValue = useAppSelector(SelectTaxAmount);
  const giftCardApplied = useAppSelector(SelectGiftCardApplied);
  const balanceAfterCredits = useAppSelector(SelectBalanceAfterCredits);
  const storeCreditCode = useAppSelector(s => s.payment.storeCreditValidation?.code);

  const selectedService = useAppSelector(s => s.fulfillment.selectedService) as number;
  if (menu === null || selectedService === null) {
    return null;
  }
  return (
    <div className="cart">
      <div className="content border-bottom border-none-at-medium">
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>x</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Subtotal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cart.map((cartEntry: CartEntry, i: number) => (
                <TableRow key={i} className="cart-item">
                  <TableCell className="cart-item-description">
                    <div className="menu-list__item">
                      <WProductComponent productMetadata={cartEntry.product.m} allowAdornment={false} description dots={false} price={false} menuModifiers={menu.modifiers} displayContext="order" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="column no-shrink menu-list__item-price">{cartEntry.quantity}</span>
                  </TableCell>
                  <TableCell>
                    <span className="column no-shrink">×</span>
                  </TableCell>
                  <TableCell>
                    <span className="column no-shrink menu-list__item-price">{cartEntry.product.m.price}</span>
                  </TableCell>
                  <TableCell className="cart-item-subtotal no-wrap">
                    <span className="menu-list__item-price">{cartEntry.product.m.price * cartEntry.quantity}</span>
                  </TableCell>
                </TableRow>
              ))}
              {selectedService === DELIVERY_SERVICE && (
                <TableRow className="cart-item">
                  <TableCell className="cart-item-description">
                    <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                      <div className="cart-item-title-subtitle column menu-list__item">
                        <h4 className="menu-list__item-title">
                          <span className="item_title">Delivery Fee{deliveryFee === 0 && " (waived)"}</span></h4>
                      </div>
                    </div>
                  </TableCell>
                  {/* <TableCell className="cart-item-quantity-price no-wrap"></TableCell> */}
                  <TableCell className="cart-item-subtotal no-wrap">
                    <span className="menu-list__item-price">
                      {deliveryFee === 0 ? <Typography sx={{ textDecoration: "line-through" }}>{fCurrency(5)}</Typography> : <>{fCurrency(deliveryFee)}</>}
                    </span>
                  </TableCell>
                </TableRow>
              )}
              {discountApplied !== 0 &&
                <TableRow className="cart-item">
                  <TableCell className="cart-item-description">
                    <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                      <div className="cart-item-title-subtitle column menu-list__item">
                        <h4 className="menu-list__item-title"><span className="item_title">Discount Code Applied (<Typography sx={{ textTransform: "none" }}>{storeCreditCode}</Typography>)</span></h4>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="cart-item-quantity-price no-wrap"></TableCell>
                  <TableCell className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">-{fCurrency(discountApplied)}</span></TableCell>
                </TableRow>}
              {taxValue > 0 &&
                <TableRow className="cart-item">
                  <TableCell className="cart-item-description">
                    <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                      <div className="cart-item-title-subtitle column menu-list__item">
                        <h4 className="menu-list__item-title"><span className="item_title">Sales Tax ({fPercent(TAX_RATE)})</span></h4>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="cart-item-quantity-price no-wrap"></TableCell>
                  <TableCell className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(taxValue)}</span></TableCell>
                </TableRow>}
              {tipValue > 0 &&
                <TableRow className="cart-item">
                  <TableCell className="cart-item-description">
                    <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                      <div className="cart-item-title-subtitle column menu-list__item">
                        <h4 className="menu-list__item-title"><span className="item_title">Gratuity*</span></h4>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="cart-item-quantity-price no-wrap"></TableCell>
                  <TableCell className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(tipValue)}</span></TableCell>
                </TableRow>}
              {giftCardApplied > 0 &&
                <TableRow className="cart-item">
                  <TableCell className="cart-item-description">
                    <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                      <div className="cart-item-title-subtitle column menu-list__item">
                        <h4 className="menu-list__item-title"><span className="item_title">Digital Gift Applied ((<Typography sx={{ textTransform: "none" }}>{storeCreditCode}</Typography>)</span></h4>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="cart-item-quantity-price no-wrap"></TableCell>
                  <TableCell className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">-{fCurrency(giftCardApplied)}</span></TableCell>
                </TableRow>}
              <TableRow className="cart-item">
                <TableCell className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Total</span></h4>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="cart-item-quantity-price no-wrap"></TableCell>
                <TableCell className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(balanceAfterCredits)}</span></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>
    </div>
  )
}