import { createListenerMiddleware, addListener, ListenerEffectAPI, isAnyOf } from '@reduxjs/toolkit'
import type { TypedStartListening, TypedAddListener } from '@reduxjs/toolkit'
import type { RootState, AppDispatch } from '../store'
import { SocketIoActions } from './SocketIoSlice';
import { setCurrentTime, setPageLoadTime } from './WMetricsSlice';
import { TIMING_POLLING_INTERVAL } from '../../components/common';
import { addToCart, removeFromCart, updateCartQuantity } from './WCartSlice';

export const ListeningMiddleware = createListenerMiddleware()

export type AppStartListening = TypedStartListening<RootState, AppDispatch>

export const startAppListening = ListeningMiddleware.startListening as AppStartListening;

export const addAppListener = addListener as TypedAddListener<RootState, AppDispatch>;

let interval;

ListeningMiddleware.startListening({
  actionCreator: SocketIoActions.receiveServerTime,// && previousState.ws.serverTime === null,
  effect: (action: ReturnType<typeof SocketIoActions.receiveServerTime>, api : ListenerEffectAPI<RootState, AppDispatch>) => {
    api.dispatch(setPageLoadTime(action.payload));
    api.dispatch(setCurrentTime(action.payload));
    const checkTiming = () => {
      api.dispatch(setCurrentTime(Date.now()));
    }
    if (api.getOriginalState().ws.serverTime === null) {
      interval = setInterval(checkTiming, TIMING_POLLING_INTERVAL);
    }
    //return () => clearInterval(interval);    
}});

ListeningMiddleware.startListening({
  matcher: isAnyOf(setCurrentTime, 
    SocketIoActions.receiveBlockedOff, 
    SocketIoActions.receiveSettings, 
    SocketIoActions.receiveLeadTime, 
    SocketIoActions.receiveCatalog, 
    addToCart, 
    removeFromCart, 
    updateCartQuantity),
  effect: (_, api : ListenerEffectAPI<RootState, AppDispatch>) => {
    //api.getState().fulfillment
    console.log("someone set the current time!");
}});

ListeningMiddleware.startListening({
  actionCreator: SocketIoActions.receiveCatalog,
  effect: (action: any, api : ListenerEffectAPI<RootState, AppDispatch>) => {
    //api.getState().fulfillment
    console.log("someone updated the catalog!");
    // TODO: determine if anything we have in the cart or the customizer is impacted and update accordingly
}});

export default ListeningMiddleware;