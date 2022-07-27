import { configureStore, createSelector, EntityId, combineReducers } from "@reduxjs/toolkit";
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
import { CartEntry, 
  ComputeCartSubTotal,
  IMenu, 
  ComputeTipBasis, 
  ComputeTipValue, 
  ComputeMainProductCategoryCount, 
  ComputeDiscountApplied, 
  ComputeTotal, 
  MetadataModifierMap, 
  ServicesEnableMap, 
  WDateUtils, 
  ComputeTaxAmount,
  CreateOrderRequestV2, 
  ComputeGiftCardApplied, 
  ComputeBalanceAfterCredits, 
  CoreCartEntry,
  WCPProductV2Dto} from "@wcp/wcpshared";
import WPaymentReducer from "./slices/WPaymentSlice";

export const RootReducer = combineReducers({
  fulfillment: WFulfillmentReducer,
  customizer: WCustomizerReducer,
  ci: WCustomerInfoReducer,
  cart: WCartReducer,
  ws: SocketIoReducer,
  metrics: WMetricsReducer,
  payment: WPaymentReducer,
  stepper: StepperReducer
});

export const store = configureStore({
  reducer: RootReducer,
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat([SocketIoMiddleware, ListeningMiddleware.middleware])
  },
});

export type RootState = ReturnType<typeof RootReducer>;
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

export const SelectMainCategoryId = (s: RootState) => s.ws.settings!.config.MAIN_CATID as string;
export const SelectMaxPartySize = (s: RootState) => s.ws.settings!.config.MAX_PARTY_SIZE as number;
export const SelectDeliveryFeeSetting = (s: RootState) => s.ws.settings!.config.DELIVERY_FEE as number;
export const SelectDeliveryAreaLink = (s: RootState) => s.ws.settings!.config.DELIVERY_LINK as string;
export const SelectTaxRate = (s: RootState) => s.ws.settings!.config.TAX_RATE as number;
export const SelectSupplementalCategoryId = (s: RootState) => s.ws.settings!.config.SUPP_CATID as string;
export const SelectAutoGratutityThreshold = (s: RootState) => s.ws.settings!.config.AUTOGRAT_THRESHOLD as number || 5;

// todo: decouple this from the cart entry and just take in the modifier map
export const GetSelectableModifiersForCartEntry = createSelector(
  (s: RootState, cartEntryId: EntityId, _: IMenu) => getCartEntry(s.cart.cart, cartEntryId),
  (_: RootState, __: EntityId, menu: IMenu) => menu,
  (entry: CartEntry | undefined, menu) =>
    entry ? GetSelectableModifiers(entry.product.m.modifier_map, menu): {}
);
export const SelectCartSubTotal = createSelector(
  (s: RootState) => getCart(s.cart.cart),
  ComputeCartSubTotal
);

export const SelectDeliveryFee = createSelector(
  (s: RootState) => s.fulfillment.deliveryInfo,
  SelectDeliveryFeeSetting,
  (deliveryInfo, deliveryFee) => deliveryInfo === null ? 0 : deliveryFee
);

export const SelectSubtotalPreDiscount = createSelector(
  SelectCartSubTotal,
  (s: RootState) => s.ws.settings!.config.DELIVERY_FEE as number,
  (cartSubTotal, deliveryFee) => (cartSubTotal + deliveryFee)
);

export const SelectDiscountApplied = createSelector(
  SelectSubtotalPreDiscount,
  (s: RootState) => s.payment.storeCreditValidation,
  ComputeDiscountApplied
);

export const SelectSubtotalAfterDiscount = createSelector(
  SelectSubtotalPreDiscount,
  SelectDiscountApplied,
  (subtotalPreDiscount, discountApplied) => subtotalPreDiscount - discountApplied
);

export const SelectTaxAmount = createSelector(
  SelectSubtotalPreDiscount,
  SelectTaxRate,
  SelectDiscountApplied,
  ComputeTaxAmount
);

export const SelectTipBasis = createSelector(
  SelectSubtotalPreDiscount,
  SelectTaxAmount,
  ComputeTipBasis
);

export const SelectTipValue = createSelector(
  (s: RootState) => s.payment.selectedTip,
  SelectTipBasis,
  ComputeTipValue
);

export const SelectTotal = createSelector(
  SelectSubtotalPreDiscount,
  SelectDiscountApplied,
  SelectTaxAmount,
  SelectTipValue,
  ComputeTotal
);

export const SelectGiftCardApplied = createSelector(
  SelectTotal,
  (s: RootState) => s.payment.storeCreditValidation,
  ComputeGiftCardApplied
);

export const SelectBalanceAfterCredits = createSelector(
  SelectTotal,
  SelectGiftCardApplied,
  ComputeBalanceAfterCredits
);


export const SelectMainProductCategoryCount = createSelector(
  SelectMainCategoryId,
  (s: RootState) => getCart(s.cart.cart),
  ComputeMainProductCategoryCount
)

export const SelectAutoGratutityEnabled = createSelector(
  SelectMainProductCategoryCount,
  SelectAutoGratutityThreshold,
  (s: RootState) => s.fulfillment.deliveryInfo,
  (count, threshold, deliveryInfo) => deliveryInfo !== null || count >= threshold
);

export const SelectHasOperatingHoursForService = createSelector(
  (s: RootState, _ : number) => s.ws.services!,
  (s: RootState, _ : number) => s.ws.settings!.operating_hours,
  (_: RootState, serviceNumber: number) => serviceNumber,
  (services, operatingHours, serviceNumber) => Object.hasOwn(services, String(serviceNumber)) && 
    serviceNumber < operatingHours.length && 
    operatingHours[serviceNumber].reduce((acc, dayIntervals) => acc || dayIntervals.some(v => v[0] < v[1] && v[0] >= 0 && v[1] <= 1440), false)
);

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
);

export const SelectWarioSubmissionArguments = createSelector(
  (s: RootState) => s.fulfillment,
  (s: RootState) => s.ci,
  (s: RootState) => getCart(s.cart.cart),
  (s: RootState) => s.payment.storeCreditValidation,
  (s: RootState) => s.metrics,
  (s: RootState) => SelectBalanceAfterCredits(s),
  (s: RootState) => SelectTipValue(s),
  (fulfillment, customerInfo, cart, storeCredit, metrics, balanceAfterCredits, tipAmount) => {
    const cartDto = cart.map((x) => ({ ...x, product: { modifiers: x.product.p.modifiers, pid: x.product.p.PRODUCT_CLASS.id } }) ) as CoreCartEntry<WCPProductV2Dto>[];
    return { 
    customerInfo,
    fulfillmentDto: fulfillment,
    special_instructions: "",
    cart: cartDto,
    metrics,
    store_credit: storeCredit,
    sliced: false,
    totals: {
      balance: balanceAfterCredits,
      tip: tipAmount,
    } } as Omit<CreateOrderRequestV2, 'nonce'>;
  })
          