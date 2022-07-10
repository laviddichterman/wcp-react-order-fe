import { configureStore, createSelector, EntityId } from "@reduxjs/toolkit";
import WCartReducer, { getCart, getCartEntry } from '../components/WCartSlice';
import WCustomizerReducer from '../components/WCustomizerSlice';
import WFulfillmentReducer from '../components/WFulfillmentSlice';
import WMetricsReducer from '../components/WMetricsSlice';
import WCustomerInfoReducer from "../components/WCustomerInfoSlice";
import SocketIoReducer, { ICategoriesAdapter, 
  IOptionTypesAdapter, 
  IOptionsAdapter, 
  IProductInstancesAdapter, 
  IProductsAdapter, 
  ProductInstanceFunctionsAdapter } from './SocketIoSlice';
import SocketIoMiddleware from "./SocketIoMiddleware";
import { CartEntry } from "../components/common";
import { IMenu, MetadataModifierMap } from "@wcp/wcpshared";
import WPaymentReducer from "../components/WPaymentSlice";
import { DELIVERY_FEE, TAX_RATE } from "../config";
import { RoundToTwoDecimalPlaces } from "../utils/numbers";

export const store = configureStore({
  reducer: {
    fulfillment: WFulfillmentReducer,
    customizer: WCustomizerReducer,
    ci: WCustomerInfoReducer,
    cart: WCartReducer,
    ws: SocketIoReducer,
    metrics: WMetricsReducer,
    payment: WPaymentReducer
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat([SocketIoMiddleware])
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const ICategoriesSelectors = ICategoriesAdapter.getSelectors((state: RootState) => state.ws.categories);
export const IOptionTypesSelectors = IOptionTypesAdapter.getSelectors((state: RootState) => state.ws.modifiers);
export const IOptionsSelectors = IOptionsAdapter.getSelectors((state: RootState) => state.ws.modifierOptions);
export const IProductInstancesSelectors = IProductInstancesAdapter.getSelectors((state: RootState) => state.ws.productInstances);
export const IProductsSelectors = IProductsAdapter.getSelectors((state: RootState) => state.ws.products);
export const ProductInstanceFunctionsSelectors = ProductInstanceFunctionsAdapter.getSelectors((state: RootState) => state.ws.productInstanceFunctions);

export const GetSelectableModifiers = (mMap : MetadataModifierMap, menu: IMenu) => Object.entries(mMap).reduce((acc, [k, v]) => {
  const modifierEntry = menu.modifiers[k];
  const omit_section_if_no_available_options = modifierEntry.modifier_type.display_flags.omit_section_if_no_available_options;
  const hidden = modifierEntry.modifier_type.display_flags.hidden;
  return (!hidden && (!omit_section_if_no_available_options || v.has_selectable)) ? { ...acc, k: v } : acc;
}, {} as MetadataModifierMap);
// todo: decouple this from the cart entry and just take in the modifier map
export const GetSelectableModifiersForCartEntry = createSelector(
  (s: RootState, cartEntryId: EntityId, _: IMenu) => getCartEntry(s.cart, cartEntryId),
  (_: RootState, __: EntityId, menu: IMenu) => menu,
  (entry: CartEntry | undefined, menu) =>
    entry ? GetSelectableModifiers(entry.product.m.modifier_map, menu): {}
);
export const SelectCartSubTotal = createSelector(
  (s: RootState) => getCart(s.cart),
  (cart: CartEntry[]) => 
    cart.reduce((acc, entry)=> acc + (entry.product.m.price * entry.quantity), 0)
);

export const SelectDeliveryFee = createSelector(
  (s: RootState) => s.fulfillment.deliveryInfo,
  (_: RootState) => DELIVERY_FEE,
  (deliveryInfo, deliveryFee) => deliveryInfo === null ? 0 : deliveryFee
);

export const SelectSubtotal = createSelector(
  SelectCartSubTotal,
  (_: RootState) => DELIVERY_FEE,
  (cartSubTotal, deliveryFee) => (cartSubTotal + deliveryFee)
);

export const SelectDiscountApplied = createSelector(
  SelectSubtotal,
  (s: RootState) => s.payment.storeCreditValidation,
  (subtotal, storeCreditValidation) => 
    storeCreditValidation !== null && storeCreditValidation.type === "DISCOUNT" ? 
      Math.min(subtotal, storeCreditValidation.amount.amount) : 0
);

export const SelectTaxAmount = createSelector(
  SelectSubtotal,
  (_: RootState) => TAX_RATE,
  SelectDiscountApplied,
  (subtotal, taxRate, discount) => RoundToTwoDecimalPlaces((subtotal-discount) * taxRate)
);

export const SelectTipBasis = createSelector(
  SelectSubtotal,
  SelectTaxAmount,
  (subtotal, taxAmount) => RoundToTwoDecimalPlaces(subtotal + taxAmount)
);

export const SelectTipValue = createSelector(
  SelectTipBasis,
  (s: RootState) => s.payment.selectedTip,
  (tipBasis, tip) => tip !== null ? (tip.isPercentage ? RoundToTwoDecimalPlaces(tip.value * tipBasis) : tip.value) : 0
);

export const SelectTotal = createSelector(
  SelectSubtotal,
  SelectDiscountApplied,
  SelectTaxAmount,
  SelectTipValue,
  (subtotal, discount, taxAmount, tipAmount) => 
    subtotal - discount + taxAmount + tipAmount
);

export const SelectGiftCardApplied = createSelector(
  SelectTotal,
  (s: RootState) => s.payment.storeCreditValidation,
  (total, storeCreditValidation) => 
    storeCreditValidation !== null && storeCreditValidation.type === "MONEY" ? 
      Math.min(total, storeCreditValidation.amount.amount) : 0
);

export const SelectBalanceAfterCredits = createSelector(
  SelectTotal,
  SelectGiftCardApplied,
  (total, giftCardApplied) => total-giftCardApplied
);