import { configureStore, createSelector, EntityId } from "@reduxjs/toolkit";
import WCartReducer, { getCart, getCartEntry } from './slices/WCartSlice';
import WCustomizerReducer from './slices/WCustomizerSlice';
import WFulfillmentReducer from './slices/WFulfillmentSlice';
import WMetricsReducer from './slices/WMetricsSlice';
import WCustomerInfoReducer from "./slices/WCustomerInfoSlice";
import StepperReducer from "./slices/StepperSlice";
import SocketIoReducer, { ICategoriesAdapter, 
  IOptionTypesAdapter, 
  IOptionsAdapter, 
  IProductInstancesAdapter, 
  IProductsAdapter, 
  ProductInstanceFunctionsAdapter } from './slices/SocketIoSlice';
import SocketIoMiddleware from "./slices/SocketIoMiddleware";
import ListeningMiddleware from "./slices/ListeningMiddleware";
import { CartEntry } from "../components/common";
import { IMenu, MetadataModifierMap, ServicesEnableMap, WDateUtils } from "@wcp/wcpshared";
import WPaymentReducer, { ComputeTipValue } from "./slices/WPaymentSlice";
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
    payment: WPaymentReducer,
    stepper: StepperReducer
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat([SocketIoMiddleware, ListeningMiddleware.middleware])
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
    storeCreditValidation !== null && storeCreditValidation.credit_type === "DISCOUNT" ? 
      Math.min(subtotal, storeCreditValidation.amount) : 0
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
  (tipBasis, tip) => tip !== null ? ComputeTipValue(tip, tipBasis) : 0
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
    storeCreditValidation !== null && storeCreditValidation.credit_type === "MONEY" ? 
      Math.min(total, storeCreditValidation.amount) : 0
);

export const SelectBalanceAfterCredits = createSelector(
  SelectTotal,
  SelectGiftCardApplied,
  (total, giftCardApplied) => total-giftCardApplied
);

export const SelectAutoGratutityEnabled = createSelector(
  SelectSubtotal,
  (s: RootState) => s.fulfillment.deliveryInfo,
  (subtotal, deliveryInfo) => deliveryInfo !== null || subtotal > 80
);

export const SelectHasOperatingHoursForService = createSelector(
  (s: RootState, _ : number) => s.ws.services!,
  (s: RootState, _ : number) => s.ws.settings!.operating_hours,
  (_: RootState, serviceNumber: number) => serviceNumber,
  (services, operatingHours, serviceNumber) => Object.hasOwn(services, String(serviceNumber)) && 
    serviceNumber < operatingHours.length && 
    operatingHours[serviceNumber].reduce((acc, dayIntervals) => acc || dayIntervals.some(v => v[0] < v[1] && v[0] >= 0 && v[1] <= 1440), false)
);

export const SelectMainCategoryId = (s: RootState) => s.ws.settings!.config.MAIN_CATID as string;
export const SelectSupplementalCategoryId = (s: RootState) => s.ws.settings!.config.SUPP_CATID as string;

export const SelectMainProductCategoryCount = createSelector(
  SelectMainCategoryId,
  (s: RootState) => getCart(s.cart),
  (MAIN_CATID, cart) => cart.reduce((acc, e) => acc + (e.categoryId === MAIN_CATID ? e.quantity : 0), 0)
)

export const SelectAvailabilityForServicesDateAndProductCount = createSelector(
  (s: RootState, _: Date | number, __: ServicesEnableMap, ___: number) => s.ws.leadtime!,
  (s: RootState, _: Date | number, __: ServicesEnableMap, ___: number) => s.ws.blockedOff!,
  (s: RootState, _: Date | number, __: ServicesEnableMap, ___: number) => s.ws.settings!,
  (s: RootState, _: Date | number, __: ServicesEnableMap, mainProductCount: number) => mainProductCount,
  (_: RootState, selectedDate: Date | number, __: ServicesEnableMap) => selectedDate,
  (_: RootState, __: Date | number, serviceSelection: ServicesEnableMap) => serviceSelection,
  (leadtime, blockedOff, settings, mainProductCount, selectedDate, serviceSelection) => 
    WDateUtils.GetInfoMapForAvailabilityComputation(blockedOff, settings, leadtime, selectedDate, serviceSelection, {cart_based_lead_time: 0, size: Math.max(mainProductCount, 1)})
);

export const SelectAvailabilityForServicesAndDate = createSelector(
  (s: RootState, selectedDate: Date | number, serviceSelection: ServicesEnableMap) => 
    (mainProductCount : number) => 
      SelectAvailabilityForServicesDateAndProductCount(s, selectedDate, serviceSelection, mainProductCount),
  (s: RootState, _: Date | number, __: ServicesEnableMap) => SelectMainProductCategoryCount(s),
  (selector, mainProductCount) => selector(mainProductCount)
);

export const SelectOptionsForServicesAndDate = createSelector(
  (s: RootState, selectedDate: Date | number, serviceSelection: ServicesEnableMap) => SelectAvailabilityForServicesAndDate(s, selectedDate, serviceSelection),
  (s: RootState, _: Date | number, __: ServicesEnableMap) => s.metrics.currentTime!,
  (_: RootState, selectedDate: Date | number, __: ServicesEnableMap) => selectedDate,
  (infoMap, currentTime, selectedDate) => WDateUtils.GetOptionsForDate(infoMap, selectedDate, currentTime)

)

export const SelectHasSpaceForPartyOf = createSelector(
  (_: RootState) => true,
  (hasSpace)=> hasSpace
)

// const HasSpaceForPartyOf = useCallback((partySize: number, orderDate: Date | number, orderTime: number) => true, []);
