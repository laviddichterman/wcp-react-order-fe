import { ICatalog, IWSettings, JSFEBlockedOff } from '@wcp/wcpshared';
import { Middleware } from 'redux'
import { io, Socket } from "socket.io-client";
import { SOCKETIO, HOST_API } from '../../config';
import { RootState } from '../store';
import { SocketIoActions } from './SocketIoSlice';

const SocketIoMiddleware: Middleware<{}, RootState> = store => {
  let socket: Socket;
  
  return next => action => {
    if (SocketIoActions.startConnection.match(action)) {
      socket = io(`${HOST_API}/${SOCKETIO.ns}`, {
        autoConnect: true, secure: true,
        transports: ["websocket", "polling"],
        withCredentials: true
      });
      socket.on('connect', () => {
        store.dispatch(SocketIoActions.setConnected());  
        socket.on('disconnect', () => {
          store.dispatch(SocketIoActions.setFailed());
        });
      });
      socket.on("WCP_SERVICES", (data: { [index:string] : string }) => {
        store.dispatch(SocketIoActions.receiveServices(data));
      });
      socket.on("WCP_SERVER_TIME", (data: { time: string; tz: string; }) => {
        store.dispatch(SocketIoActions.receiveServerTime(data));
      });
      socket.on("WCP_BLOCKED_OFF", (data: JSFEBlockedOff) => {
        store.dispatch(SocketIoActions.receiveBlockedOff(data));
      });
      socket.on("WCP_LEAD_TIMES", (data: number[]) => {
        store.dispatch(SocketIoActions.receiveLeadTime(data));
      });
      socket.on("WCP_SETTINGS", (data: IWSettings ) => {
        store.dispatch(SocketIoActions.receiveSettings(data));
      });
      socket.on("WCP_CATALOG", (data: ICatalog ) => {
        store.dispatch(SocketIoActions.receiveCatalog(data));
      });
    }
    next(action);
  }
}

export default SocketIoMiddleware;