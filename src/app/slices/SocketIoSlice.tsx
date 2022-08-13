import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { ICatalog, ICategory, IMenu, IOption, IOptionType, IProduct, IProductInstance, IProductInstanceFunction, IWSettings, JSFEBlockedOff } from "@wcp/wcpshared";

export const ProductInstanceFunctionsAdapter = createEntityAdapter<IProductInstanceFunction>({selectId: entry => entry.id});
export const IProductsAdapter = createEntityAdapter<IProduct>({selectId: entry => entry.id});
export const IProductInstancesAdapter = createEntityAdapter<IProductInstance>({selectId: entry => entry.id});
export const IOptionTypesAdapter = createEntityAdapter<IOptionType>({selectId: entry => entry.id});
export const IOptionsAdapter = createEntityAdapter<IOption>({selectId: entry => entry.id});
export const ICategoriesAdapter = createEntityAdapter<ICategory>({selectId: entry => entry.id});

export interface SocketIoState { 
  serverTime: { time: string, tz: string } | null; // ISO formatted string
  catalog: ICatalog | null;
  modifiers: EntityState<IOptionType>;
  modifierOptions: EntityState<IOption>;
  products: EntityState<IProduct>;
  productInstances: EntityState<IProductInstance>;
  categories: EntityState<ICategory>;
  productInstanceFunctions: EntityState<IProductInstanceFunction>;
  services: Record<string, string> | null;
  blockedOff: JSFEBlockedOff | null;
  leadtime: number[] | null;
  settings: IWSettings | null;
  menu: IMenu | null;
  status: 'NONE' | 'START' | 'CONNECTED' | 'FAILED'; 
}

const initialState: SocketIoState = {
  serverTime: null,
  catalog: null,
  modifiers: IOptionTypesAdapter.getInitialState(),
  modifierOptions: IOptionsAdapter.getInitialState(),
  products: IProductsAdapter.getInitialState(),
  productInstances: IProductInstancesAdapter.getInitialState(),
  categories: ICategoriesAdapter.getInitialState(),
  productInstanceFunctions: ProductInstanceFunctionsAdapter.getInitialState(),
  services: null,
  blockedOff: null,
  leadtime: null,
  settings: null,
  menu: null,
  status: "NONE"
}

const SocketIoSlice = createSlice({
  name: 'ws',
  initialState,
  reducers: {
    startConnection(state) {
      state.status = 'START';
    },
    setFailed(state) {
      state.status = 'FAILED';
    },
    setConnected(state) {
      state.status = 'CONNECTED';
    },
    receiveServerTime(state, action : PayloadAction<{ time: string, tz: string }>) {
      state.serverTime = action.payload;
    },
    receiveCatalog(state, action : PayloadAction<ICatalog>) {
      state.catalog = action.payload;
      IOptionTypesAdapter.setAll(state.modifiers, Object.values(action.payload.modifiers).map(x => x.modifier_type));
      IOptionsAdapter.setAll(state.modifierOptions, ([] as IOption[]).concat(...Object.values(action.payload.modifiers).map(x => x.options)));
      IProductsAdapter.setAll(state.products, Object.values(action.payload.products).map(x => x.product));
      IProductInstancesAdapter.setAll(state.productInstances, ([] as IProductInstance[]).concat(...Object.values(action.payload.products).map(x => x.instances)));
      ICategoriesAdapter.setAll(state.categories, Object.values(action.payload.categories).map(x => x.category));
      ProductInstanceFunctionsAdapter.setAll(state.productInstanceFunctions, action.payload.product_instance_functions);  
    },
    receiveServices(state, action : PayloadAction<{ [index:string] : string }>) {
      state.services = action.payload;
    },
    receiveBlockedOff(state, action : PayloadAction<JSFEBlockedOff>) {
      // key here is that we've re-cast the intervals to numbers
      state.blockedOff = action.payload.map(v=> v.map(e => [e[0], e[1].map(i => [Number(i[0]), Number(i[1])])]));
    },
    receiveLeadTime(state, action : PayloadAction<number[]>) {
      state.leadtime = action.payload;
    },
    receiveSettings(state, action : PayloadAction<IWSettings>) {
      state.settings = action.payload;
    },
    setMenu(state, action : PayloadAction<IMenu>) {
      state.menu = action.payload;
    }
  }
});

export const { selectAll: getProductInstanceFunctions, selectById: getProductInstanceFunctionById } =
  ProductInstanceFunctionsAdapter.getSelectors();

export const SocketIoActions = SocketIoSlice.actions;

export const IsSocketDataLoaded = (s : SocketIoState) => s.serverTime !== null && s.blockedOff !== null && s.catalog !== null && s.settings !== null && s.services !== null && s.leadtime !== null;

export default SocketIoSlice.reducer;
