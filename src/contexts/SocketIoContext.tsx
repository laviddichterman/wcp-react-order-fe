import { createContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import socketIOClient from "socket.io-client";

import { SOCKETIO, HOST_API } from '../config';

// ----------------------------------------------------------------------

export const socketRoClient = socketIOClient(`${HOST_API}/${SOCKETIO.ns}`, { autoConnect: false, secure: true,     
  transports: ["websocket", "polling"], 
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
      socketRoClient.on("WCP_SERVICES", data => { 
        dispatch({
          type: 'SET_SERVICES',
          payload: { services: data },
        });
        console.log(data);
      });
      socketRoClient.on("WCP_BLOCKED_OFF", data => {
        data.forEach((svcBlock, i) => {
          svcBlock.forEach((dayBlock, j) => {
            dayBlock[1].forEach((interval, k) => {
              data[i][j][1][k] = [Number(data[i][j][1][k][0]), Number(data[i][j][1][k][1])];
            })
          })
        })
        dispatch({
          type: 'SET_BLOCKED_OFF',
          payload: { blockedOff: data },
        });
        console.log(data);
      });
      socketRoClient.on("WCP_LEAD_TIMES", data => { 
        dispatch({
          type: 'SET_LEADTIME',
          payload: { leadtime: data },
        });
        console.log(data);
      });
      socketRoClient.on("WCP_SETTINGS", data => {
        dispatch({
          type: 'SET_SETTINGS',
          payload: { settings: data },
        });
        console.log(data);
      });
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
        catalog: state?.catalog,
        services: state?.services,
        blockedOff: state?.blockedOff,
        leadtime: state?.leadtime,
        settings: state?.settings,
      }}
    >
      {children}
    </SocketIoContext.Provider>
  );
}

export { SocketIoContext, SocketIoProvider };