import { createListenerMiddleware, addListener, ListenerEffectAPI, isAnyOf } from '@reduxjs/toolkit'
import type { TypedStartListening, TypedAddListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '../store'
import { SelectOptionsForServicesAndDate } from '../store'
import { SocketIoActions } from './SocketIoSlice';
import { enqueueSnackbar } from 'notistack'

import { setCurrentTime, setPageLoadTime } from './WMetricsSlice';
import { TIMING_POLLING_INTERVAL } from '../../components/common';
import { addToCart, removeFromCart, updateCartQuantity } from './WCartSlice';
import { setSelectedTimeExpired, setService, setTime, setDate, setSelectedDateExpired } from './WFulfillmentSlice';
import { WDateUtils } from '@wcp/wcpshared';
import { backStage, nextStage, setStage, STEPPER_STAGE_ENUM } from './StepperSlice';
import { scrollToIdAfterDelay } from '../../utils/shared';

export const ListeningMiddleware = createListenerMiddleware()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

export const startAppListening = ListeningMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

let interval;

ListeningMiddleware.startListening({
  actionCreator: SocketIoActions.receiveServerTime,// && previousState.ws.serverTime === null,
  effect: (action: ReturnType<typeof SocketIoActions.receiveServerTime>, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    api.dispatch(setPageLoadTime(action.payload));
    api.dispatch(setCurrentTime(action.payload));
    const checkTiming = () => {
      api.dispatch(setCurrentTime(Date.now()));
    }
    if (api.getOriginalState().ws.serverTime === null) {
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

ListeningMiddleware.startListening({
  matcher: isAnyOf(nextStage, backStage, setStage),
  effect: (_, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    const toId = `WARIO_step_${api.getState().stepper.stage}`;
    scrollToIdAfterDelay(toId, 400);
  }
});

ListeningMiddleware.startListening({
  actionCreator: SocketIoActions.receiveCatalog,
  effect: (action: any, api: ListenerEffectAPI<RootState, AppDispatch>) => {
    //api.getState().fulfillment
    console.log("someone updated the catalog!");
    // TODO: determine if anything we have in the cart or the customizer is impacted and update accordingly
  }
});

export default ListeningMiddleware;