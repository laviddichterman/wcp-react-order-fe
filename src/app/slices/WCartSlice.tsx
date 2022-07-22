import { createSlice, PayloadAction, createEntityAdapter, EntityState } from "@reduxjs/toolkit";
import { MenuModifiers, WProduct, WProductCompare, WProductEquals } from "@wcp/wcpshared";
import { CartEntry } from "../../components/common";


const WCartAdapter = createEntityAdapter<CartEntry>({
  selectId: entry => entry.id
});

export interface WCartState extends EntityState<CartEntry> {
  indexCounter: number;
}

const initialState: WCartState = {
  indexCounter: 1,
  ...WCartAdapter.getInitialState()
}

const WCartSlice = createSlice({
  name: 'cart',
  initialState: initialState,
  reducers: {
    addToCart(state, action: PayloadAction<{ categoryId: string, product: WProduct } >) {
      // PRECONDITION: we've already checked for duplicates
      const id = Number(state.indexCounter++).toString(10);
      // should not need a deep copy here per customizer working on mutable data, but it might be not how redux works and this needs to be a deep copy
      const newEntry = { categoryId: action.payload.categoryId, product: action.payload.product, id, isLocked: false, quantity: 1 };
      WCartAdapter.addOne(state, newEntry);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      // async dispatch toast.create({message: `Removed ${action.payload.product.m.name} from order.`} );
      WCartAdapter.removeOne(state, action.payload);
    },
    updateCartQuantity(state, action: PayloadAction<{ id: string; newQuantity: number }>) {
      // async dispatch of toast.create({message: `Changed ${pi.processed_name} quantity to ${this.s.cart[cid][i].quantity}.`} );
      WCartAdapter.updateOne(state, { id: action.payload.id, changes: { quantity: action.payload.newQuantity } });
    },
    updateCartProduct(state, action: PayloadAction<{ id: string, product: WProduct }>) {
      // PRECONDITION: we've already checked for duplicates in other products
      WCartAdapter.updateOne(state, {id: action.payload.id, changes: { product: action.payload.product }});
    },
    lockCartEntry(state, action: PayloadAction<string>) {
      WCartAdapter.updateOne(state, { id: action.payload, changes: { isLocked: true } });
    },
    unlockCartEntry(state, action: PayloadAction<string>) {
      WCartAdapter.updateOne(state, { id: action.payload, changes: { isLocked: false } });
    },
  }
});

export const { addToCart, removeFromCart, lockCartEntry, unlockCartEntry, updateCartQuantity, updateCartProduct } = WCartSlice.actions;

/**
 * Looks through the cart for a duplicate product 
 * @param cart the entries in the cart
 * @param menuModifiers menu modifiers access
 * @param categoryId categoryId of product to add/update
 * @param product the product we're attempting to add
 * @param skipId the cart entry ID to ignore in a search for a match
 * @returns the CartEntry if a match is found for the product attempting to be added, otherwise null
 */
 export const FindDuplicateInCart = (cart : CartEntry[], menuModifiers : MenuModifiers, categoryId : string, product : WProduct, skipId : string | null = null) => {
  for (let i = 0; i < cart.length; ++i) {
    const entry = cart[i];
    if (categoryId === entry.categoryId) {
      if (skipId !== entry.id && WProductEquals(WProductCompare(entry.product.p, product.p, menuModifiers))) {
        return entry;
      }
    }
  }
  // it's a new entry!
  return null;
}

/*
selectIds: (state: V) => EntityId[];
    selectEntities: (state: V) => Dictionary<T>;
    selectAll: (state: V) => T[];
    selectTotal: (state: V) => number;
    selectById: (state: V, id: EntityId) => T | undefined;
*/
export const { selectAll: getCart, selectById: getCartEntry } =
  WCartAdapter.getSelectors();

export default WCartSlice.reducer;