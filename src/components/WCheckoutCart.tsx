import { Typography } from '@mui/material';

import { WProductComponent } from './WProductComponent';
import { CartEntry, ICREDIT_RESPONSE, ITOTALS, OrderFulfillment} from './common';
import { fCurrency, fPercent } from '../utils/numbers';
import { DELIVERY_SERVICE, TAX_RATE } from '../config';


interface ICheckoutCart {
  menu: any;
  linearCart: CartEntry[],
  fulfillment: OrderFulfillment,
  creditResponse?: ICREDIT_RESPONSE,
  totals: ITOTALS
};

export function WCheckoutCart({ menu, linearCart, fulfillment, creditResponse, totals }: ICheckoutCart) {
  return (
    <div className="cart">
      <div className="content border-bottom border-none-at-medium">
        <table className="cart-table table-collapse-until-medium table-border-rows table-pad-line valign-middle header-color">
          <thead>
            <tr>
              <th>Item</th>
              <th className="hide-until-medium">
                <div className="grid-flex grid-valign-middle">
                  <span className="column no-shrink">Quantity</span>
                  <span className="column no-shrink">×</span>
                  <span className="column no-shrink">Price</span>
                </div>
              </th>
              <th className="align-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {linearCart.map((cartEntry: CartEntry, i: number) => (
              <tr key={i} className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="menu-list__item">
                      <WProductComponent product={cartEntry.pi} allowAdornment={false} description dots={false} price={false} menu={menu} displayContext="order" />
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap">
                  <div className="grid-flex grid-valign-middle">
                    <span className="column no-shrink menu-list__item-price">{cartEntry.quantity}</span>
                    <span className="column no-shrink">×</span>
                    <span className="column no-shrink menu-list__item-price">{cartEntry.pi.price}</span>
                  </div>
                </td>
                <td className="cart-item-subtotal no-wrap">
                  <span className="menu-list__item-price">{cartEntry.pi.price * cartEntry.quantity}</span>
                </td>
              </tr>
            ))}
            {fulfillment.getType() === DELIVERY_SERVICE ? (
              <tr className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Delivery Fee<span ng-show="orderCtrl.s.delivery_fee === 0"> (waived)</span></span></h4>
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap"></td>
                <td className="cart-item-subtotal no-wrap">
                  <span className="menu-list__item-price">
                    {totals.deliveryFee === 0 ? <Typography sx={{ textDecoration: "line-through" }}>{fCurrency(5)}</Typography> : <>{fCurrency(totals.deliveryFee)}</>}
                  </span>
                </td>
              </tr>
            ) : ""}
            {creditResponse && creditResponse.validation_successful && creditResponse.type === 'DISCOUNT' ?
              <tr className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Discount Code Applied (<Typography sx={{ textTransform: "none" }}>{creditResponse.code}</Typography>)</span></h4>
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap"></td>
                <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">-{fCurrency(creditResponse.amount_used)}</span></td>
              </tr>
              : ""}
            <tr className="cart-item">
              <td className="cart-item-description">
                <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                  <div className="cart-item-title-subtitle column menu-list__item">
                    <h4 className="menu-list__item-title"><span className="item_title">Sales Tax ({fPercent(TAX_RATE)})</span></h4>
                  </div>
                </div>
              </td>
              <td className="cart-item-quantity-price no-wrap"></td>
              <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(totals.computed_tax)}</span></td>
            </tr>
            {totals.tip_value === 0 ? "" :
              <tr className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Gratuity*</span></h4>
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap"></td>
                <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(totals.tip_value)}</span></td>
              </tr>}
            {creditResponse && creditResponse.validation_successful && creditResponse.type === 'MONEY' ?
              <tr className="cart-item">
                <td className="cart-item-description">
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="cart-item-title-subtitle column menu-list__item">
                      <h4 className="menu-list__item-title"><span className="item_title">Digital Gift Applied ((<Typography sx={{ textTransform: "none" }}>{creditResponse.code}</Typography>)</span></h4>
                    </div>
                  </div>
                </td>
                <td className="cart-item-quantity-price no-wrap"></td>
                <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">-{fCurrency(creditResponse.amount_used)}</span></td>
              </tr>
              : ""}
            <tr className="cart-item">
              <td className="cart-item-description">
                <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                  <div className="cart-item-title-subtitle column menu-list__item">
                    <h4 className="menu-list__item-title"><span className="item_title">Total</span></h4>
                  </div>
                </div>
              </td>
              <td className="cart-item-quantity-price no-wrap"></td>
              <td className="cart-item-subtotal no-wrap"><span className="menu-list__item-price">{fCurrency(totals.balance)}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}