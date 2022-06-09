import { createSlice } from "@reduxjs/toolkit";


export interface WCartState { 
  items: { [ productID: string]: number }
}

const initialState: WCartState = {
  items: {}
}

const WCartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {}
});

export default WCartSlice.reducer;
