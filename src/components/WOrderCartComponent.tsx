import { WProductComponent } from './WProductComponent';
import { CartEntry } from './common';

interface IOrderCart { 
  menu: any;
  linearCart: CartEntry[];
  isProductEditDialogOpen: boolean;
}

export function WOrderCart({ menu, linearCart, isProductEditDialogOpen }: IOrderCart) {
  const setRemoveEntry = (i: number) => {
  };
  const setEntryQuantity = (i: number, quantity: string, check: boolean) => {
  };
  const setProductToEdit = (entry: CartEntry) => {
  };
  return linearCart.length === 0 ? <>Empty</> :
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
            {linearCart.map((cartEntry: any, i: number) =>
              <tr key={i} className={`cart-item${cartEntry.can_edit ? " editible" : ""}`}>
                <td>
                  <div className="grid-flex grid-align-justify grid-align-left-at-small grid-valign-middle">
                    <div className="menu-list__item">
                      <WProductComponent product={cartEntry.pi} description allowAdornment={false} dots={false} menu={menu} displayContext="order" price={false} />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="grid-flex grid-valign-middle">
                    <input type="number" className="quantity" disabled={cartEntry.locked} min={1} max={99} onChange={(e) => setEntryQuantity(i, e.target.value, false)} onBlur={(e) => setEntryQuantity(i, e.target.value, true)} />
                    <span className="cart-item-remove">
                      <button disabled={cartEntry.locked} name="remove" onClick={() => setRemoveEntry(i)} className="button-remove">X</button>
                    </span>
                    {cartEntry.can_edit ?
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
