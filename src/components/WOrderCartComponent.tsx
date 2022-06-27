import { WProductComponent } from './WProductComponent';
import { CartEntry } from './common';
import { getCart, lockCartEntry } from './WCartSlice';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { useCallback } from 'react';
import { IMenu } from '@wcp/wcpshared';
import { GetSelectableModifiersForCartEntry } from '../app/store';
import { editCartEntry } from './WCustomizerSlice';
import { TextField } from '@mui/material';

interface IOrderCart { 
  menu: IMenu;
  isProductEditDialogOpen: boolean;
}

export function WOrderCart({ menu, isProductEditDialogOpen }: IOrderCart) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(s=>getCart(s.cart));
  const selectSelectableModifiersForEntry = useAppSelector(s => (id : string, menu: IMenu) => GetSelectableModifiersForCartEntry(s, id, menu));
  const productHasSelectableModifiers = useCallback((id : string, menu: IMenu) => Object.values(selectSelectableModifiersForEntry(id, menu)).length > 0, [selectSelectableModifiersForEntry]);
  const setRemoveEntry = (i: number) => {
  };
  const setEntryQuantity = (i: number, quantity: string, check: boolean) => {
  };
  const setProductToEdit = (entry: CartEntry) => {
    dispatch(lockCartEntry(entry.id));
    dispatch(editCartEntry(entry));
  };
  return cart.length === 0 ? <>Empty</> :
    <div className="cart">
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
                    <TextField inputProps={{ inputMode: 'numeric', min: 0, max: 99, pattern: '[0-9]*' }} value={cartEntry.quantity} className="quantity" disabled={cartEntry.isLocked} onBlur={(e) => setEntryQuantity(i, e.target.value, true)} />
                    <span className="cart-item-remove">
                      <button disabled={cartEntry.isLocked} name="remove" onClick={() => setRemoveEntry(i)} className="button-remove">X</button>
                    </span>
                    {productHasSelectableModifiers(cartEntry.id, menu) ?
                      <span className="cart-item-remove">
                        <button name="edit" disabled={isProductEditDialogOpen} onClick={() => setProductToEdit(cartEntry)} className="button-sml">
                          <div className="icon-pencil" />
                        </button>
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
