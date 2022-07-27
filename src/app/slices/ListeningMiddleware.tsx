import { createListenerMiddleware, addListener, ListenerEffectAPI, isAnyOf } from '@reduxjs/toolkit'
import type { TypedStartListening, TypedAddListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '../store'
import { SelectOptionsForServicesAndDate } from '../store'
import { SocketIoActions } from './SocketIoSlice';
import { enqueueSnackbar } from 'notistack'

import { incrementTimeBumps, setCurrentTime, setPageLoadTime, setPageLoadTimeLocal, setTimeToStage } from './WMetricsSlice';
import { TIMING_POLLING_INTERVAL } from '../../components/common';
import { addToCart, getCart, getDeadCart, killAllCartEntries, removeFromCart, reviveAllCartEntries, updateCartQuantity } from './WCartSlice';
import { setSelectedTimeExpired, setService, setTime, setDate, setSelectedDateExpired, SelectServiceDateTime } from './WFulfillmentSlice';
import { DoesProductExistInMenu, FilterWCPProduct, GenerateMenu, WDateUtils } from '@wcp/wcpshared';
import { backStage, nextStage, setStage } from './StepperSlice';
import { scrollToIdAfterDelay } from '../../utils/shared';
import { clearCustomizer } from './WCustomizerSlice';
import { STEPPER_STAGE_ENUM } from '../../config';

export const ListeningMiddleware = createListenerMiddleware()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

export const startAppListening = ListeningMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

let interval;

ListeningMiddleware.startListening({
  actionCreator: SocketIoActions.receiveServerTime,// && previousState.ws.serverTime === null,
  effect: (action: ReturnType<typeof SocketIoActions.receiveServerTime>, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    if (api.getOriginalState().metrics.pageLoadTime === 0) {
      api.dispatch(setPageLoadTime(action.payload));
      api.dispatch(setCurrentTime(action.payload));
      api.dispatch(setPageLoadTimeLocal(Date.now()));
      const checkTiming = () => {
        api.dispatch(setCurrentTime(Date.now()));
      }
      interval = setInterval(checkTiming, TIMING_POLLING_INTERVAL);
    }
    //return () => clearInterval(interval);    
  }
});

ListeningMiddleware.startListening({
  matcher: isAnyOf(setCurrentTime,
    setService,
    SocketIoActions.receiveBlockedOff,
    SocketIoActions.receiveSettings,
    SocketIoActions.receiveLeadTime,
    SocketIoActions.receiveCatalog,
    addToCart,
    removeFromCart,
    updateCartQuantity),
  effect: (_, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    const originalState = api.getOriginalState();
    const previouslySelectedDate = originalState.fulfillment.selectedDate;
    const previouslySelectedTime = originalState.fulfillment.selectedTime;
    const selectedService = originalState.fulfillment.selectedService;
    if (previouslySelectedDate !== null && previouslySelectedTime !== null && selectedService !== null) {
      const newOptions = SelectOptionsForServicesAndDate(api.getState(), previouslySelectedDate, { [String(selectedService)]: true });
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
    const toId = `WARIO_step_${api.getState().stepper.stage}`;
    scrollToIdAfterDelay(toId, 500);
  }
});

// listener for stage progression time metrics
ListeningMiddleware.startListening({
  actionCreator: nextStage,
  effect: (_, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    api.dispatch(setTimeToStage({ stage: api.getState().stepper.stage, ticks: Date.now() }));
  }
});

ListeningMiddleware.startListening({
  matcher: isAnyOf(SocketIoActions.receiveCatalog, setTime),
  effect: (action: any, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    const catalog = api.getState().ws.catalog;
    if (catalog !== null) {
      const menuTime = SelectServiceDateTime(api.getState().fulfillment) ?? Date.now();
      console.log(menuTime);
      const MENU = GenerateMenu(catalog, menuTime);
      // determine if anything we have in the cart or the customizer is impacted and update accordingly
      const customizerProduct = api.getState().customizer.selectedProduct;
      if (customizerProduct !== null && (!DoesProductExistInMenu(MENU, customizerProduct.p) || !FilterWCPProduct(customizerProduct.p, MENU, menuTime))) {
        enqueueSnackbar(`${customizerProduct.m.name} as configured is no longer available. Please check availability and try again.`, { variant: 'warning' });
        api.dispatch(clearCustomizer());
      }
      const cart = getCart(api.getState().cart.cart);
      const deadCart = getDeadCart(api.getState().cart.deadCart);
      const toKill = cart.filter(x => !DoesProductExistInMenu(MENU, x.product.p) || !FilterWCPProduct(x.product.p, MENU, menuTime))
      const toRevive = deadCart.filter(x => DoesProductExistInMenu(MENU, x.product.p) && FilterWCPProduct(x.product.p, MENU, menuTime));

      if (toKill.length > 0) {
        console.log("toKill");
        console.log(toKill);
        if (toKill.length < 4) {
          toKill.forEach(x=>enqueueSnackbar(`${x.product.m.name} as configured is no longer available.`, { variant: 'warning' }));
        } else {
          enqueueSnackbar(`The ${toKill.map(x=>x.product.m.name).reduceRight((acc, prod, i) => i === 0 ? acc : (i === toKill.length-1 ? `${acc}, and ${prod}` : `${acc}, ${prod}`), "")} as configured are no longer available.`, { variant: 'warning' });
        }
        api.dispatch(killAllCartEntries(toKill));
      }
      if (toRevive.length > 0) {
        console.log("toRevive");
        console.log(toRevive);
        if (toRevive.length < 4) {
          toRevive.forEach(x=>enqueueSnackbar(`${x.product.m.name} as configured is once again available and has been returned to your order.`, { variant: 'warning' }));
        } else {
          enqueueSnackbar(`The ${toRevive.map(x=>x.product.m.name).reduceRight((acc, prod, i) => i === 0 ? acc : (i === toRevive.length-1 ? `${acc}, and ${prod}` : `${acc}, ${prod}`), "")} as configured are once again available and returned to your order.`, { variant: 'warning' });
        }
        api.dispatch(reviveAllCartEntries(toRevive));
      }
      api.dispatch(SocketIoActions.setMenu(MENU));
    }
    //api.getState().fulfillment
    
  }
});

export default ListeningMiddleware;