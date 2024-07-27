import { configureStore, createSelector, combineReducers } from "@reduxjs/toolkit";
import {
  SocketIoReducer,
  IProductInstancesAdapter,
  ProductInstanceFunctionsAdapter,
  SelectAllowAdvanced,
  SelectTaxRate,
  SelectAutoGratutityThreshold,
  SelectDefaultFulfillmentId,
  SelectGratuityServiceCharge,
  getProductEntryById,
  getFulfillmentById,
  getCategoryEntryById,
  weakMapCreateSelector
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
  ComputeProductCategoryMatchCount,
  ComputeCategoryTreeIdList,
  ComputeTotal,
  MetadataModifierMap,
  WDateUtils,
  ComputeTaxAmount,
  CreateOrderRequestV2,
  ComputeDiscountsApplied,
  ComputePaymentsApplied,
  ComputeBalance,
  CoreCartEntry,
  DiscountMethod,
  WCPProductV2Dto,
  WProduct,
  ComputeSubtotalAfterDiscountAndGratuity,
  ComputeSubtotalPreDiscount,
  FulfillmentConfig,
  CURRENCY,
  StoreCreditType,
  TenderBaseStatus,
  IMoney,
  GetNextAvailableServiceDate,
  Metrics,
  FulfillmentTime,
  WFulfillmentStatus,
  PaymentMethod,
  ComputeGratuityServiceCharge,
  DetermineCartBasedLeadTime
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

const SelectSomethingFromFulfillment = <T extends keyof FulfillmentConfig>(field: T) => weakMapCreateSelector(
  (s: RootState) => s.ws.fulfillments,
  (s: RootState) => s.fulfillment.selectedService,
  (fulfillments, fulfillmentId) =>
    fulfillmentId && getFulfillmentById(fulfillments, fulfillmentId) ? getFulfillmentById(fulfillments, fulfillmentId)[field] : null
);

export const SelectFulfillmentDisplayName = SelectSomethingFromFulfillment('displayName');
export const SelectMainCategoryId = SelectSomethingFromFulfillment('orderBaseCategoryId');
export const SelectSupplementalCategoryId = SelectSomethingFromFulfillment('orderSupplementaryCategoryId');
export const SelectMenuCategoryId = SelectSomethingFromFulfillment('menuBaseCategoryId');
export const SelectMaxPartySize = SelectSomethingFromFulfillment('maxGuests');
export const SelectServiceFeeSetting = SelectSomethingFromFulfillment('serviceCharge');
export const SelectFulfillmentMinDuration = SelectSomethingFromFulfillment('minDuration');
export const SelectFulfillmentServiceTerms = SelectSomethingFromFulfillment('terms');
export const SelectFulfillmentService = SelectSomethingFromFulfillment('service');
export const SelectFulfillmentMaxGuests = SelectSomethingFromFulfillment('maxGuests');

export const selectAllowAdvancedPrompt = createSelector(
  (s: RootState) => s.customizer.selectedProduct,
  SelectAllowAdvanced,
  (prod: WProduct | null, allowAdvanced: boolean) => allowAdvanced === true && prod !== null && prod.m.advanced_option_eligible
)

export const selectCartAsDto = createSelector(
  (s: RootState) => getCart(s.cart.cart),
  (cart) => cart.map((x) => ({ ...x, product: { modifiers: x.product.p.modifiers, pid: x.product.p.productId } })) as CoreCartEntry<WCPProductV2Dto>[]
)

export const selectCartEntryBeingCustomized = createSelector(
  (s: RootState) => s.customizer.cartId,
  (s: RootState) => (cid: string) => getCartEntry(s.cart.cart, cid),
  (cartId: string | null, cartEntryGetter) => cartId !== null ? cartEntryGetter(cartId) : undefined
);

export const selectOptionState = (s: RootState) => (mtId: string, moId: string) => s.customizer.selectedProduct!.m.modifier_map[mtId].options[moId];

export const selectShowAdvanced = (s: RootState) => s.customizer.showAdvanced;

export const selectSelectedWProduct = (s: RootState) => s.customizer.selectedProduct;

export const selectIProductOfSelectedProduct = createSelector(
  selectSelectedWProduct,
  (s: RootState) => s.ws.products,
  (selectedProduct, products) => selectedProduct ? getProductEntryById(products, selectedProduct.p.productId).product : null
)

export const SelectServiceTimeDisplayString = createSelector(
  SelectFulfillmentMinDuration,
  (s: RootState) => s.fulfillment.selectedService,
  (s: RootState) => s.fulfillment.selectedTime,
  (minDuration, service, selectedTime) =>
    minDuration !== null && service !== null && selectedTime !== null ?
      (minDuration === 0 ? WDateUtils.MinutesToPrintTime(selectedTime) : `${WDateUtils.MinutesToPrintTime(selectedTime)} to ${WDateUtils.MinutesToPrintTime(selectedTime + minDuration)}`) : "");


// todo: decouple this from the cart entry and just take in the modifier map
export const GetSelectableModifiersForCartEntry = createSelector(
  (s: RootState, cartEntryId: string, _: IMenu) => getCartEntry(s.cart.cart, cartEntryId),
  (_: RootState, __: string, menu: IMenu) => menu,
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

export const SelectDiscountsApplied = createSelector(
  SelectSubtotalPreDiscount,
  (s: RootState) => s.payment.storeCreditValidations.filter(x => x.validation.credit_type === StoreCreditType.DISCOUNT),
  (subtotalPreDiscount: IMoney, discounts) => ComputeDiscountsApplied(subtotalPreDiscount, discounts.map(x=>({createdAt: x.createdAt, t: DiscountMethod.CreditCodeAmount, status: TenderBaseStatus.AUTHORIZED, discount: { balance: x.validation.amount, code: x.code, lock: x.validation.lock } }))));

export const SelectDiscountsAmountApplied = createSelector(
  SelectDiscountsApplied,
  (discountsApplied) => ({ amount: discountsApplied.reduce((acc, x) => acc + x.discount.amount.amount, 0), currency: CURRENCY.USD }));


export const SelectGratutityServiceChargeAmount = createSelector(
  SelectGratuityServiceCharge,
  SelectSubtotalPreDiscount,
  ComputeGratuityServiceCharge);

export const SelectSubtotalAfterDiscount = createSelector(
  SelectSubtotalPreDiscount,
  SelectDiscountsAmountApplied,
  SelectGratutityServiceChargeAmount,
  ComputeSubtotalAfterDiscountAndGratuity
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

export const SelectPaymentsApplied = createSelector(
  SelectTotal,
  SelectTipValue,
  (s: RootState) => s.payment.storeCreditValidations.filter(x => x.validation.credit_type === StoreCreditType.MONEY),
  (totalWithTip, tipAmount, moneyCredits) => ComputePaymentsApplied(totalWithTip, tipAmount, moneyCredits.map(x=>({createdAt: x.createdAt, t: PaymentMethod.StoreCredit, status: TenderBaseStatus.PROPOSED, payment: { balance: x.validation.amount, code: x.code, lock: x.validation.lock } }))));

export const SelectPaymentAmountsApplied = createSelector( 
  SelectPaymentsApplied,
  (paymentsApplied) => ({ amount: paymentsApplied.reduce((acc, x) => acc + x.amount.amount, 0), currency: CURRENCY.USD }));

export const SelectBalanceAfterPayments = createSelector(
  SelectTotal,
  SelectPaymentAmountsApplied,
  ComputeBalance
);

const SelectPaymentsProposedForSubmission = createSelector(
  (_: RootState, nonce: string|null) => nonce,
  SelectPaymentsApplied,
  SelectTotal,
  SelectTipValue,
  SelectBalanceAfterPayments,
  (nonce, payments, totalWithTip, tipAmount, balance) => balance.amount > 0 && nonce ? ComputePaymentsApplied(totalWithTip, tipAmount, [...payments, { createdAt: Date.now(), t: PaymentMethod.CreditCard, status: TenderBaseStatus.PROPOSED, payment: { sourceId: nonce }}]) : payments
);

export const SelectMainCategoryTreeIdList = createSelector(
  (s: RootState) => SelectMainCategoryId(s),
  (s: RootState) => s.ws.categories,
  (cId, categories) => cId ? ComputeCategoryTreeIdList(cId, (id: string) => getCategoryEntryById(categories, id)) : []
)

export const SelectMainProductCategoryCount = createSelector(
  SelectMainCategoryTreeIdList,
  (s: RootState) => getCart(s.cart.cart),
  ComputeProductCategoryMatchCount
)

export const SelectAutoGratutityEnabled = createSelector(
  SelectMainProductCategoryCount,
  SelectAutoGratutityThreshold,
  (s: RootState) => s.payment.specialInstructions,
  (s: RootState) => s.fulfillment.dineInInfo,
  (s: RootState) => s.fulfillment.deliveryInfo,
  (count, threshold, specialInstructions, dineInInfo, deliveryInfo) => deliveryInfo !== null || dineInInfo !== null || count >= threshold || (specialInstructions && specialInstructions.length > 20)
);

export const SelectHasOperatingHoursForService = createSelector(
  (s: RootState, fulfillmentId: string) => getFulfillmentById(s.ws.fulfillments, fulfillmentId),
  (fulfillment) => WDateUtils.HasOperatingHours(fulfillment.operatingHours)
);

export const SelectCartBasedLeadTime = createSelector(
  selectCartAsDto,
  (s: RootState) => s.ws.products,
  (cart, products) => DetermineCartBasedLeadTime(cart, (x: string) => getProductEntryById(products, x))
)

export const SelectAvailabilityForServicesDateAndProductCount = createSelector(
  (s: RootState, _: string, __: string[]) => s.ws.fulfillments,
  (s: RootState, __: string, ___: string[]) => SelectCartBasedLeadTime(s),
  (_: RootState, selectedDate: string, __: string[]) => selectedDate,
  (_: RootState, __: string, serviceSelection: string[]) => serviceSelection,
  (fulfillments, cartBasedLeadTime, selectedDate, serviceSelection) =>
    WDateUtils.GetInfoMapForAvailabilityComputation(serviceSelection.map(x => getFulfillmentById(fulfillments, x)), selectedDate, cartBasedLeadTime)
);

export const SelectOptionsForServicesAndDate = createSelector(
  (s: RootState, selectedDate: string, serviceSelection: string[]) => SelectAvailabilityForServicesDateAndProductCount(s, selectedDate, serviceSelection),
  (s: RootState, _: string, __: string[]) => s.ws.currentTime,
  (_: RootState, selectedDate: string, __: string[]) => selectedDate,
  (infoMap, currentTime, selectedDate) => WDateUtils.GetOptionsForDate(infoMap, selectedDate, formatISO(currentTime))
)

export const GetNextAvailableServiceDateTimeForService = createSelector(
  (s: RootState, service: string, _: Date | number) => getFulfillmentById(s.ws.fulfillments, service),
  (_: RootState, __: string, now: Date | number) => formatISO(now),
  (s: RootState, __: string, _: Date | number) => SelectCartBasedLeadTime(s),
  (fulfillment, now, cartBasedLeadTime) => GetNextAvailableServiceDate([fulfillment], now, cartBasedLeadTime)
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
  selectCartAsDto,
  (s: RootState) => s.payment.specialInstructions,
  SelectMetricsForSubmission,
  (s: RootState) => s.payment.selectedTip!,
  SelectDiscountsApplied,
  (s: RootState, nonce: string|null) => SelectPaymentsProposedForSubmission(s, nonce),
  (fulfillmentInfo, customerInfo, cart, specialInstructions, metrics, tipSelection, discountsApplied, paymentsApplied) => {
    return {
      customerInfo,
      fulfillment: { status: WFulfillmentStatus.PROPOSED, ...fulfillmentInfo },
      specialInstructions: specialInstructions ?? "",
      cart,
      metrics,
      proposedDiscounts: discountsApplied,
      proposedPayments: paymentsApplied,
      tip: tipSelection,
    } as CreateOrderRequestV2;
  })
