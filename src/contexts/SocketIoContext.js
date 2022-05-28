import { createContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import socketIOClient from "socket.io-client";

import { SOCKETIO, HOST_API } from '../config';

// ----------------------------------------------------------------------

export const socketRoClient = socketIOClient(`${HOST_API}/${SOCKETIO.ns}`, { autoConnect: false, secure: true, cookie: false,     
  transports: ["websocket", "polling"], 
  allowEIO3: true,
  cors: {
    origin: [/.+$/, /https:\/\/.*\.breezytownpizza\.com$/, `http://localhost`],
    methods: ["GET", "POST"],
    credentials: true
  }
 });

const initialState = {
  socketRo: null,
  catalog: null
};

const handlers = {
  INITIALIZE_CLIENT: (state, action) => {
    const { socketRo } = action.payload;
    return { ...state, socketRo };
  },
  SET_CATALOG: (state, action) => {
    const { catalog } = action.payload;
    return { ...state, catalog };
  },
  DISCONNECT: (state) => ({
    ...state,
    socketRo: null
  }),
};

const reducer = (state, action) => (handlers[action.type] ? handlers[action.type](state, action) : state);

const SocketIoContext = createContext({
  ...initialState,
});

// ----------------------------------------------------------------------

SocketIoProvider.propTypes = {
  children: PropTypes.node,
};

function SocketIoProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);


  useEffect(() => {
    const initialize = () => {
      try {
        dispatch({
          type: 'INITIALIZE_CLIENT',
          payload: { socketRo: socketRoClient },
        });

      } catch (err) {
        console.error(err);
        dispatch({
          type: 'INITIALIZE_CLIENT',
          payload: { socketRo: null },
        });
      }
    };

    if (!socketRoClient) {
      initialize();
    }
    else {
      socketRoClient.open();
      socketRoClient.on("connect", () => {
        socketRoClient.on("WCP_CATALOG", data => {
          dispatch({
            type: 'SET_CATALOG',
            payload: { catalog: data },
          });
          console.log(data);
        });
      });
    }
    return () => {
      dispatch({
        type: 'DISCONNECT',
        payload: { socketRo: null },
      });
      socketRoClient.disconnect();
    };
  }, []);



  return (
    <SocketIoContext.Provider
      value={{
        ...state,
        catalog: state?.catalog
      }}
    >
      {children}
    </SocketIoContext.Provider>
  );
}

export { SocketIoContext, SocketIoProvider };