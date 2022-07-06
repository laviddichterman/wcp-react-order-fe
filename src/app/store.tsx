import { configureStore, createSelector, EntityId } from "@reduxjs/toolkit";
import WCartReducer, { getCartEntry } from '../components/WCartSlice';
import WCustomizerReducer from '../components/WCustomizerSlice';
import WFulfillmentReducer from '../components/WFulfillmentSlice';
import WMetricsReducer from '../components/WMetricsSlice';
import WCustomerInfoReducer from "../components/WCustomerInfoSlice";
import SocketIoReducer, { ICategoriesAdapter, IOptionTypesAdapter, IOptionsAdapter, IProductInstancesAdapter, IProductsAdapter, ProductInstanceFunctionsAdapter } from './SocketIoSlice';
import SocketIoMiddleware from "./SocketIoMiddleware";
import { CartEntry } from "../components/common";
import { IMenu, MetadataModifierMap } from "@wcp/wcpshared";

export const store = configureStore({
  reducer: {
    fulfillment: WFulfillmentReducer,
    customizer: WCustomizerReducer,
    ci: WCustomerInfoReducer,
    cart: WCartReducer,
    ws: SocketIoReducer,
    metrics: WMetricsReducer
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