import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CartEntry, IMenu, WProduct, IOption, IOptionState, IOptionType, MTID_MOID, OptionPlacement, OptionQualifier, WCPProduct, WCPProductGenerateMetadata, ICatalog } from "@wcp/wcpshared";

function GenerateMetadata(catalog: ICatalog, menu: IMenu, product: WCPProduct, serviceTime: Date | number, fulfillment: number) {
  const productEntry = menu.product_classes[product.PRODUCT_CLASS.id];
  return WCPProductGenerateMetadata(product, productEntry, catalog, menu.modifiers, serviceTime, fulfillment);
}

export interface WCustomizerState {
  // allow the prompt to enable advanced options to appear (basically, this should be a memoized check on if there could be any advanced options)
  // which means it should probably just be a selector on selectedProduct?.m.advanced_option_eligible ?? false;
  // anyway... todo remove this flag
  allowAdvanced: boolean;
  // the advanced option opt in state
  showAdvanced: boolean;
  cartId: string | null;
  categoryId: string | null;
  // NOTE: the selected product is allocated to either be edited or added directly to a cart entry
  selectedProduct: WProduct | null;
  advancedModifierOption: MTID_MOID | null;
  advancedModifierInitialState: IOptionState;
};

const initialState: WCustomizerState = {
  allowAdvanced: false,
  showAdvanced: false,
  cartId: null,
  categoryId: null,
  selectedProduct: null,
  advancedModifierOption: null,
  advancedModifierInitialState: { placement: OptionPlacement.NONE, qualifier: OptionQualifier.REGULAR }
};

export const WCustomizerSlice = createSlice({
  name: 'customizer',
  initialState,
  reducers: {
    editCartEntry(state, action: PayloadAction<CartEntry>) {
      state.allowAdvanced = action.payload.product.m.advanced_option_eligible;
      state.showAdvanced = action.payload.product.m.advanced_option_selected;
      state.cartId = action.payload.id;
      state.categoryId = action.payload.categoryId;
      state.selectedProduct = structuredClone(action.payload.product);
    },
    customizeProduct(state, action: PayloadAction<{ product: WProduct, categoryId: string }>) {
      state.allowAdvanced = action.payload.product.m.advanced_option_eligible;
      state.showAdvanced = action.payload.product.m.advanced_option_selected;
      state.categoryId = action.payload.categoryId;
      state.selectedProduct = structuredClone(action.payload.product);
    },
    setShowAdvanced(state, action: PayloadAction<boolean>) {
      state.showAdvanced = state.allowAdvanced && action.payload;
    },
    setAdvancedModifierOption(state, action: PayloadAction<MTID_MOID | null>) {
      if (state.selectedProduct !== null &&
        action.payload !== null &&
        Object.hasOwn(state.selectedProduct.m.modifier_map, action.payload[0]) &&
        Object.hasOwn(state.selectedProduct.m.modifier_map[action.payload[0]].options, action.payload[1])) {
        state.advancedModifierInitialState = state.selectedProduct.m.modifier_map[action.payload[0]].options[action.payload[1]];
      }
      else {
        state.advancedModifierInitialState = initialState.advancedModifierInitialState;
      }
      state.advancedModifierOption = action.payload;
    },
    clearCustomizer(state) {
      // todo: see if this can just be a shallow copy
      Object.assign(state, initialState);
    },
    updateModifierOptionStateCheckbox(state, action: PayloadAction<{ mt: IOptionType, mo: IOption, optionState: IOptionState, catalog: ICatalog, menu: IMenu, serviceTime: number, fulfillment: number }>) {
      if (state.selectedProduct !== null) {
        const newOptInstance = { ...action.payload.optionState, option_id: action.payload.mo.id };
        if (!Object.hasOwn(state.selectedProduct.p.modifiers, action.payload.mt.id)) {
          state.selectedProduct.p.modifiers[action.payload.mt.id] = [];
        }
        if (action.payload.optionState.placement === OptionPlacement.NONE) {
          state.selectedProduct.p.modifiers[action.payload.mt.id] = state.selectedProduct.p.modifiers[action.payload.mt.id].filter(x => x.option_id !== action.payload.mo.id);
        }
        else {
          if (action.payload.mt.min_selected === 0 && action.payload.mt.max_selected === 1) {
            // checkbox that requires we unselect any other values since it kinda functions like a radio
            state.selectedProduct.p.modifiers[action.payload.mt.id] = [];
          }
          const moIdX = state.selectedProduct.p.modifiers[action.payload.mt.id].findIndex(x => x.option_id === action.payload.mo.id);
          if (moIdX === -1) {
            const modifierOptions = action.payload.menu.modifiers[action.payload.mt.id].options;
            state.selectedProduct.p.modifiers[action.payload.mt.id].push(newOptInstance);
            state.selectedProduct.p.modifiers[action.payload.mt.id].sort((a, b) => modifierOptions[a.option_id].index - modifierOptions[b.option_id].index);
          }
          else {
            state.selectedProduct.p.modifiers[action.payload.mt.id][moIdX] = newOptInstance;
          }
        }
        // regenerate metadata
        state.selectedProduct.m = GenerateMetadata(action.payload.catalog, action.payload.menu, state.selectedProduct.p, action.payload.serviceTime, action.payload.fulfillment);
      }

    },
    updateModifierOptionStateToggleOrRadio(state, action: PayloadAction<{ mtId: string, moId: string, catalog: ICatalog, menu: IMenu, serviceTime: number, fulfillment: number }>) {
      if (state.selectedProduct !== null) {
        state.selectedProduct.p.modifiers[action.payload.mtId] = [{ placement: OptionPlacement.WHOLE, qualifier: OptionQualifier.REGULAR, option_id: action.payload.moId }];
        // regenerate metadata
        state.selectedProduct.m = GenerateMetadata(action.payload.catalog, action.payload.menu, state.selectedProduct.p, action.payload.serviceTime, action.payload.fulfillment);
      }
    }
  }
});

export const { editCartEntry, customizeProduct, setShowAdvanced, clearCustomizer, setAdvancedModifierOption, updateModifierOptionStateCheckbox, updateModifierOptionStateToggleOrRadio } = WCustomizerSlice.actions;

export default WCustomizerSlice.reducer;
