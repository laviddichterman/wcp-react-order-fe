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
  WCPProductV2Dto,
  WProduct} from "@wcp/wcpshared";
import { WPaymentReducer } from "./slices/WPaymentSlice";

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

export const SelectSquareAppId = (s: RootState) => s.ws.settings?.config.SQUARE_APPLICATION_ID as string ?? "";
export const SelectSquareLocationId = (s: RootState) => s.ws.settings?.config.SQUARE_LOCATION as string ?? "";
export const SelectAllowAdvanced = (s: RootState) => s.ws.settings?.config.ALLOW_ADVANCED as boolean ?? false;
export const SelectAllowSlicing = (s: RootState) => s.ws.settings?.config.ALLOW_SLICING as boolean ?? false;
export const SelectMainCategoryId = (s: RootState) => s.ws.settings?.config.MAIN_CATID as string ?? "";
export const SelectSupplementalCategoryId = (s: RootState) => s.ws.settings?.config.SUPP_CATID as string ?? "";
export const SelectMenuCategoryId = (s: RootState) => s.ws.settings?.config.MENU_CATID as string ?? "";
export const SelectMaxPartySize = (s: RootState) => s.ws.settings?.config.MAX_PARTY_SIZE as number ?? 20;
export const SelectDeliveryFeeSetting = (s: RootState) => s.ws.settings!.config.DELIVERY_FEE as number ?? 5;
export const SelectDeliveryAreaLink = (s: RootState) => s.ws.settings!.config.DELIVERY_LINK as string;
export const SelectTaxRate = (s: RootState) => s.ws.settings!.config.TAX_RATE as number;
export const SelectAutoGratutityThreshold = (s: RootState) => s.ws.settings!.config.AUTOGRAT_THRESHOLD as number ?? 5;

export const selectAllowAdvancedPrompt = createSelector(
  (s: RootState) => s.customizer.selectedProduct,
  SelectAllowAdvanced,
  (prod: WProduct | null, allowAdvanced: boolean) => allowAdvanced === true && prod !== null && prod.m.advanced_option_eligible
)

export const selectCartEntryBeingCustomized = createSelector(
  (s: RootState) => s.customizer.cartId,
  (s: RootState) => (cid: string) => getCartEntry(s.cart.cart, cid),
  (cartId: string | null, cartEntryGetter) => cartId !== null ? cartEntryGetter(cartId) : undefined
);

// we cast here because nothing should be asking for the option state if there's no selected product
export const selectOptionState = (s: RootState) => (mtId: string, moId: string) => s.customizer.selectedProduct!.m.modifier_map[mtId].options[moId];

export const selectShowAdvanced = (s: RootState) => s.customizer.showAdvanced;

export const selectSelectedProduct = (s: RootState) => s.customizer.selectedProduct;



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
  SelectDeliveryFee,
  (cartSubTotal, deliveryFee) => {
    console.log(cartSubTotal);
    return (cartSubTotal + deliveryFee);}
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
  (subtotalBeforeDiscount: number, discount: number, taxAmount: number, tipAmount: number) => {
    console.log(subtotalBeforeDiscount) 
    return ComputeTotal(subtotalBeforeDiscount, discount, taxAmount, tipAmount);
  }
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
  (_: RootState, __: Date | number, ___: ServicesEnableMap, mainProductCount: number) => mainProductCount,
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

// export const SelectFirstAvailableDateAndTimeForService = createSelector(
//   (s: RootState, service: number) => SelectHasOperatingHoursForService(s, service),
//   (s: RootState, _ : number) => s.ws.
// )

export const SelectAmountCreditUsed = createSelector(
  (s: RootState) => SelectDiscountApplied(s),
  (s: RootState) => SelectGiftCardApplied(s),
  (discountCreditApplied, moneyCreditApplied) => Math.max(discountCreditApplied, moneyCreditApplied) 
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
  (s: RootState) => s.payment.storeCreditInput,
  (s: RootState) => s.payment.specialInstructions,
  (s: RootState) => s.payment.squareNonce,
  (s: RootState) => s.metrics,
  (s: RootState) => SelectBalanceAfterCredits(s),
  (s: RootState) => SelectAmountCreditUsed(s),
  (s: RootState) => SelectTipValue(s),
  (fulfillment, customerInfo, cart, storeCredit, creditCode, specialInstructions, nonce, metrics, balanceAfterCredits, creditApplied, tipAmount) => {
    const cartDto = cart.map((x) => ({ ...x, product: { modifiers: x.product.p.modifiers, pid: x.product.p.PRODUCT_CLASS.id } }) ) as CoreCartEntry<WCPProductV2Dto>[];
    return { 
    customerInfo,
    fulfillmentDto: fulfillment,
    special_instructions: specialInstructions ?? "",
    cart: cartDto,
    metrics,
    nonce,
    store_credit: storeCredit !== null ? { validation: storeCredit, code: creditCode, amount_used: creditApplied } : null,
    sliced: false,
    totals: {
      balance: balanceAfterCredits,
      tip: tipAmount,
    } } as CreateOrderRequestV2;
  })
          