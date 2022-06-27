import { createEntityAdapter, createSlice, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { ICatalog, ICategory, IOption, IOptionType, IProduct, IProductInstance, IProductInstanceFunction, IWBlockedOff, IWSettings } from "@wcp/wcpshared";

export const ProductInstanceFunctionsAdapter = createEntityAdapter<IProductInstanceFunction>({selectId: entry => entry._id});
export const IProductsAdapter = createEntityAdapter<IProduct>({selectId: entry => entry._id});
export const IProductInstancesAdapter = createEntityAdapter<IProductInstance>({selectId: entry => entry._id});
export const IOptionTypesAdapter = createEntityAdapter<IOptionType>({selectId: entry => entry._id});
export const IOptionsAdapter = createEntityAdapter<IOption>({selectId: entry => entry._id});
export const ICategoriesAdapter = createEntityAdapter<ICategory>({selectId: entry => entry._id});

export interface SocketIoState { 
  catalog: ICatalog | null;
  modifiers: EntityState<IOptionType>;
  modifierOptions: EntityState<IOption>;
  products: EntityState<IProduct>;
  productInstances: EntityState<IProductInstance>;
  categories: EntityState<ICategory>;
  productInstanceFunctions: EntityState<IProductInstanceFunction>;
  services: { [index:string] : string } | null;
  blockedOff: IWBlockedOff | null;
  leadtime: number[] | null;
  settings: IWSettings | null;
  status: 'NONE' | 'START' | 'CONNECTED' | 'FAILED'; 
}

const initialState: SocketIoState = {
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
    receiveBlockedOff(state, action : PayloadAction<IWBlockedOff>) {
      state.blockedOff = action.payload;
    },
    receiveLeadTime(state, action : PayloadAction<number[]>) {
      state.leadtime = action.payload;
    },
    receiveSettings(state, action : PayloadAction<IWSettings>) {
      state.settings = action.payload;
    }
  }
});


export const SocketIoActions = SocketIoSlice.actions;

export default SocketIoSlice.reducer;
