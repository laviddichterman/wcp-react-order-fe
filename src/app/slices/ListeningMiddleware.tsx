import { createListenerMiddleware, addListener, ListenerEffectAPI, isAnyOf } from '@reduxjs/toolkit'
import type { TypedStartListening, TypedAddListener } from '@reduxjs/toolkit'
import { RootState, AppDispatch, GetNextAvailableServiceDateTime } from '../store'
import { SelectOptionsForServicesAndDate } from '../store'
import { CatalogSelectors, SocketIoActions, scrollToIdOffsetAfterDelay } from '@wcp/wario-ux-shared';
import { enqueueSnackbar } from 'notistack'
import { CanThisBeOrderedAtThisTimeAndFulfillment, CartEntry, GenerateMenu, WCPProductGenerateMetadata, WDateUtils } from '@wcp/wcpshared';


import { incrementTimeBumps, setTimeToStage } from './WMetricsSlice';
import { STEPPER_STAGE_ENUM } from '../../config';
import { addToCart, getCart, getDeadCart, killAllCartEntries, removeFromCart, reviveAllCartEntries, updateCartQuantity, updateManyCartProducts } from './WCartSlice';
import { setSelectedTimeExpired, setService, setTime, setDate, setSelectedDateExpired, SelectServiceDateTime } from './WFulfillmentSlice';
import { backStage, nextStage, setStage } from './StepperSlice';
import { clearCustomizer, updateCustomizerProductMetadata, updateModifierOptionStateCheckbox, updateModifierOptionStateToggleOrRadio } from './WCustomizerSlice';


export const ListeningMiddleware = createListenerMiddleware()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

export const startAppListening = ListeningMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

ListeningMiddleware.startListening({
  matcher: isAnyOf(SocketIoActions.setCurrentTime,
    setService,
    SocketIoActions.receiveFulfillments,
    SocketIoActions.receiveSettings,
    SocketIoActions.receiveCatalog,
    addToCart,
    removeFromCart,
    updateCartQuantity),
  effect: (_, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    const originalState = api.getOriginalState();
    const isConfirmed = originalState.payment.submitToWarioStatus === 'SUCCEEDED'; // omit because if it bumps it here, then the server will likely bump it too|| originalState.payment.submitToWarioStatus === 'PENDING';
    const previouslySelectedDate = originalState.fulfillment.selectedDate;
    const previouslySelectedTime = originalState.fulfillment.selectedTime;
    const selectedService = api.getState().fulfillment.selectedService;
    const fulfillments = api.getState().ws.fulfillments!;
    if (previouslySelectedDate !== null && previouslySelectedTime !== null && selectedService !== null && Object.hasOwn(fulfillments, selectedService) && !isConfirmed) {
      const newOptions = SelectOptionsForServicesAndDate(api.getState(), previouslySelectedDate, [selectedService]);
      if (!newOptions.find(x => x.value === previouslySelectedTime)) {
        if (newOptions.length > 0) {
          const earlierOptions = newOptions.filter(x => x.value < previouslySelectedTime);
          const laterOptions = newOptions.filter(x => x.value > previouslySelectedTime);
          const closestEarlierOption = earlierOptions.length > 0 ? earlierOptions[earlierOptions.length - 1] : null;
          const closestLaterOption = laterOptions.length > 0 ? laterOptions[0] : null;
          const newOption = (closestEarlierOption !== null && closestLaterOption !== null) ?
            ((previouslySelectedTime - closestEarlierOption.value) <= (closestLaterOption.value - previouslySelectedTime) ?
              closestEarlierOption : closestLaterOption) :
            (closestEarlierOption ?? closestLaterOption);
          api.dispatch(setTime(newOption!.value));
          enqueueSnackbar(`Previously selected time of ${WDateUtils.MinutesToPrintTime(previouslySelectedTime)} is no longer available for your order. Updated to closest available time of ${WDateUtils.MinutesToPrintTime(newOption!.value)}.`, { variant: 'warning' });
          api.dispatch(incrementTimeBumps());
          api.dispatch(setSelectedTimeExpired());
        } else {
          // no options for date anymore, send them back to the time selection screen
          api.dispatch(setSelectedDateExpired());
          api.dispatch(setDate(null));
          api.dispatch(setTime(null));
          enqueueSnackbar(`Previously selected date is no longer available for your order.`, { variant: 'warning' });
          api.dispatch(setStage(STEPPER_STAGE_ENUM.TIMING));
        }
      }
    }
  }
});

// handle scrolling on transitions
ListeningMiddleware.startListening({
  matcher: isAnyOf(nextStage, backStage, setStage),
  effect: (_, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    //const toId = `WARIO_step_${api.getState().stepper.stage}`;
    scrollToIdOffsetAfterDelay("WARIO_order", 500);
  }
});

// listener for stage progression time metrics
ListeningMiddleware.startListening({
  actionCreator: nextStage,
  effect: (_, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    api.dispatch(setTimeToStage({ stage: api.getOriginalState().stepper.stage, ticks: Date.now() }));
  }
});

ListeningMiddleware.startListening({
  matcher: isAnyOf(updateModifierOptionStateToggleOrRadio, updateModifierOptionStateCheckbox),
  effect: (_, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    const s = api.getState(); 
    const catalog = CatalogSelectors(s.ws);
    const customizerProduct = s.customizer.selectedProduct!;
    const service = api.getState().fulfillment.selectedService!;
    const serviceTime = SelectServiceDateTime(api.getState().fulfillment)!;
    api.dispatch(updateCustomizerProductMetadata(WCPProductGenerateMetadata(customizerProduct.p, catalog, serviceTime, service)));
  }
});

ListeningMiddleware.startListening({
  matcher: isAnyOf(SocketIoActions.receiveCatalog, setTime, setService),
  effect: (_: any, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    const catalog = CatalogSelectors(api.getState().ws);
    const currentTime = api.getState().ws.currentTime;
    const fulfillments = api.getState().ws.fulfillments;
    if (catalog !== null && currentTime !== 0 && fulfillments !== null) {
      const service = api.getState().fulfillment.selectedService ?? Object.keys(fulfillments)[0];
      const menuTime = SelectServiceDateTime(api.getState().fulfillment) ?? WDateUtils.ComputeServiceDateTime(GetNextAvailableServiceDateTime(api.getState()));
      const MENU = GenerateMenu(catalog, api.getState().ws.catalog?.version ?? "", menuTime, service);
      // determine if anything we have in the cart or the customizer is impacted and update accordingly
      const customizerProduct = api.getState().customizer.selectedProduct;
      const customizerCategoryId = api.getState().customizer.categoryId;
      let regenerateCustomizerMetadata = false;
      if (customizerProduct !== null) {
        if (!CanThisBeOrderedAtThisTimeAndFulfillment(customizerProduct.p, MENU, catalog, menuTime, service) ||
          (customizerCategoryId !== null &&
            (!Object.hasOwn(MENU.categories, customizerCategoryId) ||
              MENU.categories[customizerCategoryId].serviceDisable.indexOf(service) !== -1))) {
          enqueueSnackbar(`${customizerProduct.m.name} as configured is no longer available. Please check availability and try again.`, { variant: 'warning' });
          api.dispatch(clearCustomizer());
        }
        else {
          regenerateCustomizerMetadata = true;
        }
      }
      const cart = getCart(api.getState().cart.cart);
      const deadCart = getDeadCart(api.getState().cart.deadCart);
      const toKill: CartEntry[] = [];
      const toRefreshMetadata: CartEntry[] = [];
      cart.forEach(x => !CanThisBeOrderedAtThisTimeAndFulfillment(x.product.p, MENU, catalog, menuTime, service) || !Object.hasOwn(MENU.categories, x.categoryId) || MENU.categories[x.categoryId].serviceDisable.indexOf(service) !== -1 ? toKill.push(x) : toRefreshMetadata.push(x));
      const toRevive = deadCart.filter(x => CanThisBeOrderedAtThisTimeAndFulfillment(x.product.p, MENU, catalog, menuTime, service) && Object.hasOwn(MENU.categories, x.categoryId) && MENU.categories[x.categoryId].serviceDisable.indexOf(service) === -1);

      if (toKill.length > 0) {
        if (toKill.length < 4) {
          toKill.forEach(x => enqueueSnackbar(`${x.product.m.name} as configured is no longer available.`, { variant: 'warning' }));
        } else {
          enqueueSnackbar(`The ${toKill.map(x => x.product.m.name).reduceRight((acc, prod, i) => i === 0 ? acc : (i === toKill.length - 1 ? `${acc}, and ${prod}` : `${acc}, ${prod}`), "")} as configured are no longer available.`, { variant: 'warning' });
        }
        api.dispatch(killAllCartEntries(toKill));
      }
      api.dispatch(SocketIoActions.setMenu(MENU));
      if (regenerateCustomizerMetadata) {
        api.dispatch(updateCustomizerProductMetadata(WCPProductGenerateMetadata(customizerProduct!.p, catalog, menuTime, service)));
      }
      if (toRefreshMetadata.length > 0) {
        api.dispatch(updateManyCartProducts(toRefreshMetadata.map(x=>({id: x.id, product: {...x.product, m: WCPProductGenerateMetadata(x.product.p, catalog, menuTime, service)}}))));
      }
      if (toRevive.length > 0) {
        if (toRevive.length < 4) {
          toRevive.forEach(x => enqueueSnackbar(`${x.product.m.name} as configured is once again available and has been returned to your order.`, { variant: 'warning' }));
        } else {
          enqueueSnackbar(`The ${toRevive.map(x => x.product.m.name).reduceRight((acc, prod, i) => i === 0 ? acc : (i === toRevive.length - 1 ? `${acc}, and ${prod}` : `${acc}, ${prod}`), "")} as configured are once again available and returned to your order.`, { variant: 'warning' });
        }
        api.dispatch(reviveAllCartEntries(toRevive.map(x=>({...x, product: {...x.product, m: WCPProductGenerateMetadata(x.product.p, catalog, menuTime, service)}}))));
      }
    }
    //api.getState().fulfillment 
  }
});

export default ListeningMiddleware;