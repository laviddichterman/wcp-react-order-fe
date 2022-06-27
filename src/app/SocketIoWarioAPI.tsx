
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
// import { io, Socket } from "socket.io-client";

// import { EmptySplitApi } from './baseAPI';

// import { ICatalog, ICategory, IOption, IOptionInstance, IOptionType, IProduct, IProductInstance, IProductInstanceFunction, IWBlockedOff, IWSettings } from "@wcp/wcpshared";
// import { EndpointBuilder } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
// import { SOCKETIO, HOST_API } from '../config';

// export interface SocketIoState {
//   catalog: ICatalog | null;
//   services: { [index: string]: string } | null;
//   blockedOff: IWBlockedOff | null;
//   leadtime: number[] | null;
//   settings: IWSettings | null;
//   status: 'NONE' | 'START' | 'CONNECTED' | 'FAILED';
// }

// const initialState: SocketIoState = {
//   catalog: null,
//   services: null,
//   blockedOff: null,
//   leadtime: null,
//   settings: null,
//   status: "NONE"
// }


// export const WarioSlice = EmptySplitApi.injectEndpoints({
//   overrideExisting: false,

//   // The "endpoints" represent operations and requests for this server
//   endpoints: builder => ({
//     // The `getPosts` endpoint is a "query" operation that returns data
//     getPosts: builder.query({
//       // The URL for the request is '/fakeApi/posts'
//       query: () => '/posts'
//     })
//   })
// })


// const ProductInstanceFunctionsAdapter = createEntityAdapter<IProductInstanceFunction>({selectId: entry => entry._id});
// const IProductsAdapter = createEntityAdapter<IProduct>({selectId: entry => entry._id});
// const IProductInstancesAdapter = createEntityAdapter<IProductInstance>({selectId: entry => entry._id});
// const IOptionTypesAdapter = createEntityAdapter<IOptionType>({selectId: entry => entry._id});
// const IOptionsAdapter = createEntityAdapter<IOption>({selectId: entry => entry._id});
// const ICategoriesAdapter = createEntityAdapter<ICategory>({selectId: entry => entry._id});



// export const api = createApi({
//   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
//   endpoints: (build) => { 
//     const socket = io(`${HOST_API}/${SOCKETIO.ns}`, {
//       autoConnect: false, secure: true,
//       transports: ["websocket", "polling"],
//       withCredentials: true
//     });
//     return {
//     getCatalog: build.query<EntityState<ICatalog> >({
//       query: (channel) => `messages/${channel}`,
//       transformResponse(response: Message[]) {
//         return messagesAdapter.addMany(messagesAdapter.getInitialState(), response)
//       },
//       async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {

//         try {
//           await cacheDataLoaded;

//           const listener = (event: MessageEvent) => {
//             const data = JSON.parse(event.data)
//             if (!isMessage(data) || data.channel !== arg) return

//             updateCachedData((draft) => {
//               messagesAdapter.upsertOne(draft, data)
//             })
//           }
//           socket.on('connect', () => {
//             store.dispatch(SocketIoActions.setConnected());
//           });
    
//           socket.on("WCP_SERVICES", (data: { [index:string] : string }) => {
//             console.log(data);
//             store.dispatch(SocketIoActions.receiveServices(data));
//           });
    
//           socket.on("WCP_BLOCKED_OFF", (data: IWBlockedOff) => {
//             console.log(data);
//             store.dispatch(SocketIoActions.receiveBlockedOff(data));
//           });
    
//           socket.on("WCP_LEAD_TIMES", (data: number[]) => {
//             console.log(data);
//             store.dispatch(SocketIoActions.receiveLeadTime(data));
//           });
    
//           socket.on("WCP_SETTINGS", (data: IWSettings ) => {
//             console.log(data);
//             store.dispatch(SocketIoActions.receiveSettings(data));
//           });
    
//           socket.on("WCP_CATALOG", (data: ICatalog ) => {
//             console.log(data);
//             store.dispatch(SocketIoActions.receiveCatalog(data));
//           });
    
//           ws.addEventListener('message', listener)
//         } catch { }
//         await cacheEntryRemoved;
//         socket.disconnect();
//       },
//     }),
//   }),
// })

// export const { useGetMessagesQuery } = api


// // Export the auto-generated hook for the `getPosts` query endpoint
// export const { useGetPostsQuery } = WarioSlice

// // initialState,
// // reducers: {
// //   startConnection(state) {
// //     state.status = 'START';
// //   },
// //   setFailed(state) {
// //     state.status = 'FAILED';
// //   },
// //   setConnected(state) {
// //     state.status = 'CONNECTED';
// //   },
// //   receiveCatalog(state, action : PayloadAction<ICatalog>) {
// //     state.catalog = action.payload;
// //   },
// //   receiveServices(state, action : PayloadAction<{ [index:string] : string }>) {
// //     state.services = action.payload;
// //   },
// //   receiveBlockedOff(state, action : PayloadAction<IWBlockedOff>) {
// //     state.blockedOff = action.payload;
// //   },
// //   receiveLeadTime(state, action : PayloadAction<number[]>) {
// //     state.leadtime = action.payload;
// //   },
// //   receiveSettings(state, action : PayloadAction<IWSettings>) {
// //     state.settings = action.payload;
// //   }
// //}

// //export const SocketIoActions = SocketIoSlice.actions;

// export default SocketIoSlice.reducer;
