import { WProductComponent } from './WProductComponent';
import { CartEntry } from './common';
import { getCart, lockCartEntry, removeFromCart, updateCartQuantity } from '../app/slices/WCartSlice';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { useCallback } from 'react';
import { IMenu } from '@wcp/wcpshared';
import { IconButton } from '@mui/material';
import { Clear, Edit } from '@mui/icons-material';
import { GetSelectableModifiersForCartEntry } from '../app/store';
import { CheckedNumericInput } from './CheckedNumericTextInput';

interface IOrderCart {
  menu: IMenu;
  isProductEditDialogOpen: boolean;
  setProductToEdit: (entry: CartEntry) => void;
}

export function WOrderCart({ menu, isProductEditDialogOpen, setProductToEdit }: IOrderCart) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(s => getCart(s.cart));
  const selectSelectableModifiersForEntry = useAppSelector(s => (id: string, menu: IMenu) => GetSelectableModifiersForCartEntry(s, id, menu));
  const productHasSelectableModifiers = useCallback((id: string, menu: IMenu) => Object.values(selectSelectableModifiersForEntry(id, menu)).length > 0, [selectSelectableModifiersForEntry]);
  const setRemoveEntry = (id: string) => {
    dispatch(removeFromCart(id));
  };
  const setEntryQuantity = (id: string, quantity: number | null) => {
    if (quantity !== null) {
      dispatch(updateCartQuantity({ id, newQuantity: quantity }));
    }
  };
  return cart.length === 0 ? <></> :  
    <div id="orderCart" className="cart">
      <hr className="separator" />
      <h3 className="flush">Current Order</h3>
      <div className="content">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((cartEntry, i: number) =>
              <tr key={i} className={`cart-item${productHasSelectableModifiers(cartEntry.id, menu) ? " editible" : ""}`}>
                <td>
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="menu-list__item">
                      <WProductComponent productMetadata={cartEntry.product.m} description allowAdornment={false} dots={false} menuModifiers={menu.modifiers} displayContext="order" price={false} />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="grid-flex grid-valign-middle">
                    <CheckedNumericInput type="number" inputProps={{ inputMode: 'numeric', min: 1, max: 99, pattern: '[0-9]*', step: 1 }} value={cartEntry.quantity} className="quantity" disabled={cartEntry.isLocked} onChange={(value) => setEntryQuantity(cartEntry.id, value)} parseFunction={parseInt} allowEmpty={false} />
                    <span className="cart-item-remove">
                      <IconButton size="small" disabled={cartEntry.isLocked} name="remove" onClick={() => setRemoveEntry(cartEntry.id)} className="button-remove">
                        <Clear /></IconButton>
                    </span>
                    {productHasSelectableModifiers(cartEntry.id, menu) ?
                      <span className="cart-item-remove">
                        <IconButton size="small" disabled={isProductEditDialogOpen || cartEntry.isLocked} onClick={() => setProductToEdit(cartEntry)} className="button-sml"><Edit /></IconButton>
                      </span> : ""}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
};
