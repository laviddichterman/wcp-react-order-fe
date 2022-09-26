import { configureStore, createSelector, EntityId, combineReducers } from "@reduxjs/toolkit";
import {
  SocketIoReducer,
  IProductInstancesAdapter,
  ProductInstanceFunctionsAdapter,
  SelectAllowAdvanced,
  SelectTaxRate,
  SelectAutoGratutityThreshold,
  SelectDefaultFulfillmentId
} from '@wcp/wario-ux-shared';
import WCartReducer, { getCart, getCartEntry } from './slices/WCartSlice';
import WCustomizerReducer from './slices/WCustomizerSlice';
import WFulfillmentReducer from './slices/WFulfillmentSlice';
import WMetricsReducer from './slices/WMetricsSlice';
import WCustomerInfoReducer from "./slices/WCustomerInfoSlice";
import StepperReducer from "./slices/StepperSlice";
import { SocketIoMiddleware } from "./slices/SocketIoMiddleware";
import ListeningMiddleware from "./slices/ListeningMiddleware";
import {
  ComputeCartSubTotal,
  IMenu,
  ComputeTipBasis,
  ComputeTipValue,
  ComputeMainProductCategoryCount,
  ComputeTotal,
  MetadataModifierMap,
  WDateUtils,
  ComputeTaxAmount,
  CreateOrderRequestV2,
  ComputeCreditsApplied,
  ComputeBalanceAfterCredits,
  CoreCartEntry,
  WCPProductV2Dto,
  WProduct,
  ComputeSubtotalAfterDiscount,
  ComputeSubtotalPreDiscount,
  FulfillmentConfig,
  CURRENCY,
  StoreCreditType,
  IMoney,
  JSFECreditV2,
  GetNextAvailableServiceDate,
  Metrics,
  FulfillmentTime,
  WFulfillmentStatus
} from "@wcp/wcpshared";
import { WPaymentReducer } from "./slices/WPaymentSlice";
import { differenceInMinutes, formatISO, startOfDay } from "date-fns";

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

export const IProductInstancesSelectors = IProductInstancesAdapter.getSelectors((state: RootState) => state.ws.productInstances);
export const ProductInstanceFunctionsSelectors = ProductInstanceFunctionsAdapter.getSelectors((state: RootState) => state.ws.productInstanceFunctions);

export const GetSelectableModifiers = (mMap: MetadataModifierMap, menu: IMenu) => Object.entries(mMap).reduce((acc, [k, v]) => {
  const modifierEntry = menu.modifiers[k];
  const omit_section_if_no_available_options = modifierEntry.modifier_type.displayFlags.omit_section_if_no_available_options;
  const hidden = modifierEntry.modifier_type.displayFlags.hidden;
  return (!hidden && (!omit_section_if_no_available_options || v.has_selectable)) ? { ...acc, k: v } : acc;
}, {} as MetadataModifierMap);

const SelectSomethingFromFulfillment = <T extends keyof FulfillmentConfig>(field: T) => createSelector(
  (s: RootState) => s.ws.fulfillments,
  (s: RootState) => s.fulfillment.selectedService,
  (fulfillments, fulfillmentId) =>
    fulfillments !== null &&
      fulfillmentId !== null &&
      Object.hasOwn(fulfillments, fulfillmentId) ? fulfillments[fulfillmentId][field] : null
);

export const SelectMainCategoryId = SelectSomethingFromFulfillment('orderBaseCategoryId');
export const SelectSupplementalCategoryId = SelectSomethingFromFulfillment('orderSupplementaryCategoryId');
export const SelectMenuCategoryId = SelectSomethingFromFulfillment('menuBaseCategoryId');
export const SelectMaxPartySize = SelectSomethingFromFulfillment('maxGuests');
export const SelectServiceFeeSetting = SelectSomethingFromFulfillment('serviceCharge');

// createSelector(
//   (s: RootState) => getCart(s.cart.cart),
//   (s: RootState) => s.ws.catalog!,
//   (cart, catalog) => {
//     return Object.entries(cart.reduce((cartMap: Record<string, CartEntry[]>, entry) =>
//       Object.hasOwn(cartMap, entry.categoryId) ?
//         { ...cartMap, [entry.categoryId]: [...cartMap[entry.categoryId], entry] } :
//         { ...cartMap, [entry.categoryId]: [entry] },
//       {})).sort(([keyA, _], [keyB, __]) => catalog.categories[keyA].category.ordinal - catalog.categories[keyB].category.ordinal);
//   }
// )
//<P extends object, T extends CoreCartEntry<P>>


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

export const selectOptionState = (s: RootState) => (mtId: string, moId: string) => s.customizer.selectedProduct!.m.modifier_map[mtId].options[moId];

export const selectShowAdvanced = (s: RootState) => s.customizer.showAdvanced;

export const selectSelectedProduct = (s: RootState) => s.customizer.selectedProduct;

export const SelectServiceTimeDisplayString = createSelector(
  (s: RootState) => s.ws.fulfillments,
  (s: RootState) => s.fulfillment.selectedService,
  (s: RootState) => s.fulfillment.selectedTime,
  (fulfillments, service, selectedTime) =>
    fulfillments !== null &&
      service !== null &&
      selectedTime !== null ?
      (fulfillments[service].minDuration !== 0 ? `${WDateUtils.MinutesToPrintTime(selectedTime)} to ${WDateUtils.MinutesToPrintTime(selectedTime + fulfillments[service].minDuration)}` : WDateUtils.MinutesToPrintTime(selectedTime)) : "");


// todo: decouple this from the cart entry and just take in the modifier map
export const GetSelectableModifiersForCartEntry = createSelector(
  (s: RootState, cartEntryId: EntityId, _: IMenu) => getCartEntry(s.cart.cart, cartEntryId),
  (_: RootState, __: EntityId, menu: IMenu) => menu,
  (entry, menu) =>
    entry ? GetSelectableModifiers(entry.product.m.modifier_map, menu) : {}
);

export const SelectCartSubTotal = createSelector(
  (s: RootState) => getCart(s.cart.cart),
  ComputeCartSubTotal
);

export const SelectOrderForServiceFeeComputation = createSelector(
  (_: RootState) => 0,
  (nothing) => nothing
);

export const SelectServiceFee = createSelector(
  SelectOrderForServiceFeeComputation,
  SelectServiceFeeSetting,
  (s: RootState) => s.ws.catalog!,
  (partialOrder, serviceFeeFunctionId, catalog) => ({ amount: 0, currency: CURRENCY.USD })//partialOrder === null || serviceFeeFunctionId === null ? 0 : OrderFunctional.ProcessOrderInstanceFunction(partialOrder, catalog.orderInstanceFunctions[serviceFeeFunctionId], catalog)
);

export const SelectSubtotalPreDiscount = createSelector(
  SelectCartSubTotal,
  SelectServiceFee,
  ComputeSubtotalPreDiscount
);

const CreateSelectorForCreditUsedOfType = (creditType: StoreCreditType, preCreditTotalSelector: (s: RootState) => IMoney) => createSelector(
  preCreditTotalSelector,
  (s: RootState) => s.payment.storeCreditValidations.filter(x => x.validation.credit_type === creditType),
  ComputeCreditsApplied);

const CreateSelectSelectCreditApplied = (creditsUsedSelector: (s: RootState) => JSFECreditV2[]) => createSelector(
  creditsUsedSelector,
  (credits) => ({ amount: credits.reduce((acc, x) => acc + x.amount_used.amount, 0), currency: CURRENCY.USD }));


export const SelectDiscountCreditValidationsWithAmounts = CreateSelectorForCreditUsedOfType(StoreCreditType.DISCOUNT, SelectSubtotalPreDiscount);

export const SelectDiscountApplied = CreateSelectSelectCreditApplied(SelectDiscountCreditValidationsWithAmounts);

export const SelectSubtotalAfterDiscount = createSelector(
  SelectSubtotalPreDiscount,
  SelectDiscountApplied,
  ComputeSubtotalAfterDiscount
);

export const SelectTaxAmount = createSelector(
  SelectSubtotalAfterDiscount,
  SelectTaxRate,
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
  SelectSubtotalAfterDiscount,
  SelectTaxAmount,
  SelectTipValue,
  ComputeTotal
);

export const SelectGiftCardValidationsWithAmounts = CreateSelectorForCreditUsedOfType(StoreCreditType.MONEY, SelectTotal);

export const SelectGiftCardApplied = CreateSelectSelectCreditApplied(SelectGiftCardValidationsWithAmounts);

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
  (s: RootState) => s.fulfillment.dineInInfo,
  (s: RootState) => s.fulfillment.deliveryInfo,
  (count, threshold, dineInInfo, deliveryInfo) => deliveryInfo !== null || dineInInfo !== null || count >= threshold
);

export const SelectHasOperatingHoursForService = createSelector(
  (s: RootState, _: string) => s.ws.fulfillments!,
  (_: RootState, fulfillmentId: string) => fulfillmentId,
  (fulfillments, fulfillmentId) => WDateUtils.HasOperatingHours(fulfillments[fulfillmentId].operatingHours)
);

export const SelectAvailabilityForServicesDateAndProductCount = createSelector(
  (s: RootState, _: string, __: string[], ___: number) => s.ws.fulfillments!,
  (_: RootState, __: string, ___: string[], mainProductCount: number) => mainProductCount,
  (_: RootState, selectedDate: string, __: string[]) => selectedDate,
  (_: RootState, __: string, serviceSelection: string[]) => serviceSelection,
  (fulfillments, mainProductCount, selectedDate, serviceSelection) =>
    WDateUtils.GetInfoMapForAvailabilityComputation(serviceSelection.map(x => fulfillments[x]), selectedDate, { cart_based_lead_time: 0, size: Math.max(mainProductCount, 1) })
);

export const SelectAvailabilityForServicesAndDate = createSelector(
  (s: RootState, selectedDate: string, serviceSelection: string[]) =>
    (mainProductCount: number) =>
      SelectAvailabilityForServicesDateAndProductCount(s, selectedDate, serviceSelection, mainProductCount),
  (s: RootState, _: string, __: string[]) => SelectMainProductCategoryCount(s),
  (selector, mainProductCount) => selector(mainProductCount)
);

export const SelectOptionsForServicesAndDate = createSelector(
  (s: RootState, selectedDate: string, serviceSelection: string[]) => SelectAvailabilityForServicesAndDate(s, selectedDate, serviceSelection),
  (s: RootState, _: string, __: string[]) => s.ws.currentTime,
  (_: RootState, selectedDate: string, __: string[]) => selectedDate,
  (infoMap, currentTime, selectedDate) => WDateUtils.GetOptionsForDate(infoMap, selectedDate, formatISO(currentTime))
)

export const GetNextAvailableServiceDateTimeForService = createSelector(
  (s: RootState, __: string, _: Date | number) => s.ws.fulfillments,
  (s: RootState, __: string, _: Date | number) => SelectMainProductCategoryCount(s),
  (_: RootState, service: string, __: Date | number) => service,
  (_: RootState, __: string, now: Date | number) => now,
  (fulfillments, orderSize, service, now) => fulfillments !== null && Object.hasOwn(fulfillments, service) ? GetNextAvailableServiceDate([fulfillments[service]], orderSize, formatISO(now)) : null
);

// Note: this falls back to now if there's really nothing for the selected service or for dine-in
export const GetNextAvailableServiceDateTime = createSelector(
  (s: RootState) => (service: string) => GetNextAvailableServiceDateTimeForService(s, service, s.ws.currentTime),
  (s: RootState) => s.fulfillment.selectedService,
  (s: RootState) => s.ws.currentTime,
  SelectDefaultFulfillmentId,
  (nextAvailableForServiceFunction, selectedService, currentTime, defaultFulfillment) => {
    if (selectedService !== null) {
      const nextAvailableForSelectedService = nextAvailableForServiceFunction(selectedService);
      if (nextAvailableForSelectedService) {  
        return nextAvailableForSelectedService;
      }
    }
    return (nextAvailableForServiceFunction(defaultFulfillment) ?? 
      { selectedDate: WDateUtils.formatISODate(currentTime), 
        selectedTime: differenceInMinutes(currentTime, startOfDay(currentTime))}) as FulfillmentTime;
  });

export const SelectHasSpaceForPartyOf = createSelector(
  (_: RootState) => true,
  (hasSpace) => hasSpace
);

export const SelectMetricsForSubmission = createSelector(
  (s: RootState) => s.metrics,
  (s: RootState) => s.ws.pageLoadTime,
  (s: RootState) => s.ws.pageLoadTimeLocal,
  (metrics, pageLoadTime, pageLoadTimeLocal) => ({ 
    ...metrics, 
    pageLoadTime, 
    submitTime: metrics.submitTime - pageLoadTimeLocal, 
    timeToFirstProduct: metrics.timeToFirstProduct - pageLoadTimeLocal, 
    timeToServiceDate: metrics.timeToServiceDate - pageLoadTimeLocal,
    timeToServiceTime: metrics.timeToServiceTime - pageLoadTimeLocal,
    timeToStage: metrics.timeToStage.map(x=>x-pageLoadTimeLocal)
   } as Metrics)
)

export const SelectWarioSubmissionArguments = createSelector(
  (s: RootState) => s.fulfillment,
  (s: RootState) => s.ci,
  (s: RootState) => getCart(s.cart.cart),
  (s: RootState) => s.payment.specialInstructions,
  SelectMetricsForSubmission,
  SelectBalanceAfterCredits,
  (s: RootState) => s.payment.selectedTip!,
  SelectDiscountCreditValidationsWithAmounts,
  SelectGiftCardValidationsWithAmounts,
  (fulfillmentInfo, customerInfo, cart, specialInstructions, metrics, balanceAfterCredits, tipSelection, discountCredits, giftCredits) => {
    const cartDto = cart.map((x) => ({ ...x, product: { modifiers: x.product.p.modifiers, pid: x.product.p.PRODUCT_CLASS.id } })) as CoreCartEntry<WCPProductV2Dto>[];
    return {
      customerInfo,
      fulfillment: { status: WFulfillmentStatus.PROPOSED, ...fulfillmentInfo },
      specialInstructions: specialInstructions ?? "",
      cart: cartDto,
      metrics,
      creditValidations: [...discountCredits, ...giftCredits],
      balance: balanceAfterCredits,
      tip: tipSelection,
    } as CreateOrderRequestV2;
  })
