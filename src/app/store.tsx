import { configureStore, createSelector, EntityId, combineReducers } from "@reduxjs/toolkit";
import {
  SocketIoReducer, 
  ICategoriesAdapter,
  IOptionTypesAdapter,
  IOptionsAdapter,
  IProductInstancesAdapter,
  IProductsAdapter,
  ProductInstanceFunctionsAdapter
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
  CartEntry,
  ComputeCartSubTotal,
  IMenu,
  ComputeTipBasis,
  ComputeTipValue,
  ComputeMainProductCategoryCount,
  ComputeDiscountApplied,
  ComputeTotal,
  MetadataModifierMap,
  WDateUtils,
  ComputeTaxAmount,
  CreateOrderRequestV2,
  ComputeGiftCardApplied,
  ComputeBalanceAfterCredits,
  CoreCartEntry,
  WCPProductV2Dto,
  WProduct,
  ComputeSubtotalAfterDiscount,
  ComputeSubtotalPreDiscount
} from "@wcp/wcpshared";
import { WPaymentReducer } from "./slices/WPaymentSlice";
import { addDays, formatISO, startOfDay } from "date-fns";

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

export const GetSelectableModifiers = (mMap: MetadataModifierMap, menu: IMenu) => Object.entries(mMap).reduce((acc, [k, v]) => {
  const modifierEntry = menu.modifiers[k];
  const omit_section_if_no_available_options = modifierEntry.modifier_type.displayFlags.omit_section_if_no_available_options;
  const hidden = modifierEntry.modifier_type.displayFlags.hidden;
  return (!hidden && (!omit_section_if_no_available_options || v.has_selectable)) ? { ...acc, k: v } : acc;
}, {} as MetadataModifierMap);

export const SelectSquareAppId = (s: RootState) => s.ws.settings?.config.SQUARE_APPLICATION_ID as string ?? "";
export const SelectSquareLocationId = (s: RootState) => s.ws.settings?.config.SQUARE_LOCATION as string ?? "";
export const SelectAllowAdvanced = (s: RootState) => s.ws.settings?.config.ALLOW_ADVANCED as boolean ?? false;
export const SelectMainCategoryId = (s: RootState) => s.ws.settings?.config.MAIN_CATID as string ?? "";
export const SelectSupplementalCategoryId = (s: RootState) => s.ws.settings?.config.SUPP_CATID as string ?? "";
export const SelectMenuCategoryId = (s: RootState) => s.ws.settings?.config.MENU_CATID as string ?? "";
export const SelectMaxPartySize = (s: RootState) => s.ws.settings?.config.MAX_PARTY_SIZE as number ?? 20;
export const SelectDeliveryFeeSetting = (s: RootState) => s.ws.settings!.config.DELIVERY_FEE as number ?? 5;
export const SelectDeliveryAreaLink = (s: RootState) => s.ws.settings!.config.DELIVERY_LINK as string;
export const SelectTaxRate = (s: RootState) => s.ws.settings!.config.TAX_RATE as number;
export const SelectAutoGratutityThreshold = (s: RootState) => s.ws.settings!.config.AUTOGRAT_THRESHOLD as number ?? 5;
export const SelectMessageRequestVegan = (s: RootState) => s.ws.settings!.config.MESSAGE_REQUEST_VEGAN as string ?? "";
export const SelectMessageRequestHalf = (s: RootState) => s.ws.settings!.config.MESSAGE_REQUEST_HALF as string ?? "";
export const SelectMessageRequestWellDone = (s: RootState) => s.ws.settings!.config.MESSAGE_REQUEST_WELLDONE as string ?? "";
export const SelectMessageRequestSlicing = (s: RootState) => s.ws.settings!.config.MESSAGE_REQUEST_SLICING as string ?? "";

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
    entry ? GetSelectableModifiers(entry.product.m.modifier_map, menu) : {}
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
  ComputeSubtotalPreDiscount
);

export const SelectDiscountApplied = createSelector(
  SelectSubtotalPreDiscount,
  (s: RootState) => s.payment.storeCreditValidation,
  ComputeDiscountApplied
);

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
    WDateUtils.GetInfoMapForAvailabilityComputation(serviceSelection.map(x=>fulfillments[x]), selectedDate, { cart_based_lead_time: 0, size: Math.max(mainProductCount, 1) })
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
  (s: RootState, _: string, __: string[]) => s.metrics.currentTime!,
  (_: RootState, selectedDate: string, __: string[]) => selectedDate,
  (infoMap, currentTime, selectedDate) => WDateUtils.GetOptionsForDate(infoMap, selectedDate, formatISO(currentTime))
)

// TODO: move to WCPShared
export const GetNextAvailableServiceDateTimeForService = createSelector(
  (s: RootState, service: string, _: Date | number) => SelectHasOperatingHoursForService(s, service),
  (s: RootState, service: string, _: Date | number) => (testDate: string) => SelectOptionsForServicesAndDate(s, testDate, [service]).filter(x => x.disabled),
  (_: RootState, __: string, now: Date | number) => now,
  (operatingHoursForService, selectOptionsFunction, now) => {
    if (operatingHoursForService) {
      const today = startOfDay(now);
      for (let i = 0; i < 7; ++i) {
        const dateAttempted = formatISO(addDays(today, i), { representation: 'date' });
        const options = selectOptionsFunction(dateAttempted);
        if (options.length > 0) {
          return WDateUtils.ComputeServiceDateTime(dateAttempted, options[0].value);
        }
      }
    }
    return null;
  })

// TODO: move to WCPShared
// Note: this falls back to now if there's really nothing for the selected service or for dine-in
export const GetNextAvailableServiceDateTime = createSelector(
  (s: RootState) => (service: string) => GetNextAvailableServiceDateTimeForService(s, service, s.metrics.currentTime),
  (s: RootState) => s.fulfillment.selectedService,
  (s: RootState) => s.metrics.currentTime,
  (nextAvailableForServiceFunction, selectedService, currentTime) => {
    if (selectedService !== null) {
      const nextAvailableForSelectedService = nextAvailableForServiceFunction(selectedService);
      if (nextAvailableForSelectedService) {
        return nextAvailableForSelectedService;
      }
    }
    return nextAvailableForServiceFunction() ?? currentTime;
  });

export const SelectAmountCreditUsed = createSelector(
  (s: RootState) => SelectDiscountApplied(s),
  (s: RootState) => SelectGiftCardApplied(s),
  (discountCreditApplied, moneyCreditApplied) => Math.max(discountCreditApplied, moneyCreditApplied)
)

export const SelectHasSpaceForPartyOf = createSelector(
  (_: RootState) => true,
  (hasSpace) => hasSpace
);

export const SelectWarioSubmissionArguments = createSelector(
  (s: RootState) => s.fulfillment,
  (s: RootState) => s.ci,
  (s: RootState) => getCart(s.cart.cart),
  (s: RootState) => s.payment.storeCreditValidation,
  (s: RootState) => s.payment.storeCreditInput,
  (s: RootState) => s.payment.specialInstructions,
  (s: RootState) => s.metrics,
  (s: RootState) => SelectBalanceAfterCredits(s),
  (s: RootState) => SelectAmountCreditUsed(s),
  (s: RootState) => SelectTipValue(s),
  (fulfillmentInfo, customerInfo, cart, storeCredit, creditCode, specialInstructions, metrics, balanceAfterCredits, creditApplied, tipAmount) => {
    const cartDto = cart.map((x) => ({ ...x, product: { modifiers: x.product.p.modifiers, pid: x.product.p.PRODUCT_CLASS.id } })) as CoreCartEntry<WCPProductV2Dto>[];
    return {
      customerInfo,
      fulfillment: fulfillmentInfo,
      specialInstructions: specialInstructions ?? "",
      cart: cartDto,
      metrics,
      creditValidations: storeCredit !== null ? { validation: storeCredit, code: creditCode, amount_used: creditApplied } : null,
      sliced: false,
      totals: {
        balance: balanceAfterCredits,
        tip: tipAmount,
      }
    } as CreateOrderRequestV2;
  })
