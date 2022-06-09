import { configureStore } from "@reduxjs/toolkit";
import WCartReducer from '../components/WCartSlice';
//import productsReducer from '../features/products/productsSlice';
export const store  = configureStore({
  reducer: {
    cart: WCartReducer,
    //products: productsReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;