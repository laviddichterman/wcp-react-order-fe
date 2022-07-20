import React, { useCallback, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { FormControl, FormGroup, FormLabel, Radio, RadioGroup, Grid, Button, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import { SettingsTwoTone } from "@mui/icons-material";
import { WProductComponent } from './WProductComponent';
import { IMenu, WProduct, MenuModifiers, MetadataModifierMapEntry, WCPOption, DisableDataCheck, OptionPlacement, OptionQualifier, IOptionState, MTID_MOID } from '@wcp/wcpshared';
import { clearCustomizer, 
  selectAllowAdvancedPrompt, 
  selectCartEntryBeingCustomized,
  selectOptionState, 
  selectSelectedProduct, 
  selectShowAdvanced, 
  setAdvancedModifierOption, 
  setShowAdvanced, 
  updateModifierOptionStateCheckbox, 
  updateModifierOptionStateToggleOrRadio } from '../app/slices/WCustomizerSlice';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import DialogContainer from './dialog.container';
import { addToCart, FindDuplicateInCart, getCart, unlockCartEntry, updateCartProduct, updateCartQuantity } from '../app/slices/WCartSlice';
import { SelectServiceDateTime } from '../app/slices/WFulfillmentSlice';

interface IModifierOptionToggle {
  toggleOptionChecked: WCPOption;
  toggleOptionUnchecked: WCPOption;
  menu: IMenu;
}

function WModifierOptionToggle({ menu, toggleOptionChecked, toggleOptionUnchecked }: IModifierOptionToggle) {
  const dispatch = useAppDispatch();
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const optionUncheckedState = useAppSelector(selectOptionState)(toggleOptionUnchecked.mt.id, toggleOptionUnchecked.mo.id);
  const optionCheckedState = useAppSelector(selectOptionState)(toggleOptionChecked.mt.id, toggleOptionChecked.mo.id);
  const optionValue = useMemo(() => optionCheckedState?.placement === OptionPlacement.WHOLE, [optionCheckedState?.placement]);
  if (!optionUncheckedState || !optionCheckedState || !serviceDateTime) {
    return null;
  }
  const toggleOption = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    //dispatch(set appropriate option value)
    dispatch(updateModifierOptionStateToggleOrRadio({
      mtId: toggleOptionChecked.mt.id,
      moId: e.target.checked ? toggleOptionChecked.mo.id : toggleOptionUnchecked.mo.id,
      menu,
      serviceTime: serviceDateTime.valueOf()
    }));
  }
  return (
    <span className="option-circle-container">
      <FormControlLabel className="option-whole option-circle"
        disableTypography
        control={<Checkbox

          className="input-whole"
          disabled={optionValue ? !optionUncheckedState.enable_whole : !optionUncheckedState.enable_whole}
          value={optionValue}
          onChange={toggleOption} />}
        label={<span className='topping_text'>{toggleOptionChecked.mo.item.display_name}</span>} />
    </span>);

  //   <div class="flexitem" ng-if="ctrl.display_type === 1"> \
  //     <input type="checkbox" id="{{ctrl.toggle_values[1].shortname}}_whole" class="input-whole" \
  //       ng-disabled="!ctrl.pmenuctrl.selection.modifier_map[ctrl.mtid].options[ctrl.toggle_values[1].moid].enable_whole" \
  //       ng-model="ctrl.current_single_value" ng-true-value="1" \
  //       ng-false-value="0" ng-change="ctrl.PostModifyCallback(0, 0, false)"> \
  //     <span class="option-circle-container"> \
  //       <label for="{{ctrl.toggle_values[1].shortname}}_whole" class="option-whole option-circle"></label> \
  //     </span> \
  //     <label class="topping_text" for="{{ctrl.toggle_values[1].shortname}}_whole">{{ctrl.toggle_values[1].name}}</label> \
  //   </div> \
}

interface IModifierRadioCustomizerComponent {
  options: WCPOption[];
  menu: IMenu;
};

export function WModifierRadioComponent({ options, menu }: IModifierRadioCustomizerComponent) {
  const dispatch = useAppDispatch();
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const getObjectStateSelector = useAppSelector(selectOptionState);
  const modifierOptionState = useAppSelector(s => s.customizer.selectedProduct?.p.modifiers[options[0].mt.id] ?? [])
  const getOptionState = useCallback((moId: string) => getObjectStateSelector(options[0].mt.id, moId), [options, getObjectStateSelector]);
  if (!serviceDateTime) {
    return null;
  }

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    dispatch(updateModifierOptionStateToggleOrRadio({
      mtId: options[0].mt.id,
      moId: e.target.value,
      menu,
      serviceTime: serviceDateTime.valueOf()
    }));
  }
  return (<RadioGroup
    onChange={onChange}
    row
    value={modifierOptionState.length === 1 ? modifierOptionState[0].option_id : null}
    aria-labelledby={`modifier_control_${options[0].mt.id}`}>{
      options.map((opt, i) => <span className="option-circle-container" key={i}>
        <FormControlLabel
          disableTypography
          className="option-whole option-circle"
          value={opt.mo.id}
          control={<Radio
            className="input-whole"
            disabled={!getOptionState(opt.mo.id)?.enable_whole}
          />}
          label={<span className='topping_text'>{opt.mo.item.display_name}</span>} />
      </span>)}
  </RadioGroup>
  );
  // <input type="radio" id="{{ctrl.option.shortname}}_whole" className="input-whole" ng-model="ctrl.modctrl.current_single_value" ng-value="ctrl.option.moid" ng-disabled="!ctrl.GetEnableState().enable_whole" ng-change="ctrl.UpdateOption(ctrl.config.WHOLE, false)" />
  // <span className="option-circle-container">
  //   <label ng-show="!ctrl.advanced_option_selected" htmlFor="{{ctrl.option.shortname}}_whole" className="option-whole option-circle" />
  // </span>
  // <label className="topping_text" htmlFor="{{ctrl.option.shortname}}_whole" ng-disabled="!ctrl.GetEnableState().enable_whole">{{ ctrl.option.name }}</label>

};

function useModifierOptionCheckbox(menu: IMenu, option: WCPOption) {
  const dispatch = useAppDispatch();
  const optionState = useAppSelector(selectOptionState)(option.mt.id, option.mo.id);
  const isWhole = useMemo(() => optionState.placement === OptionPlacement.WHOLE, [optionState.placement]);
  const isLeft = useMemo(() => optionState.placement === OptionPlacement.LEFT, [optionState.placement]);
  const isRight = useMemo(() => optionState.placement === OptionPlacement.RIGHT, [optionState.placement]);
  const onUpdateOption = (newState: IOptionState, serviceDateTime: Date) => {
    dispatch(updateModifierOptionStateCheckbox({
      mt: option.mt,
      mo: option.mo,
      optionState: newState,
      menu,
      serviceTime: serviceDateTime.valueOf()
    }));
  };
  const onClickWhole = (serviceDateTime : Date) => {
    onUpdateOption({ placement: +!isWhole * OptionPlacement.WHOLE, qualifier: optionState.qualifier }, serviceDateTime);
  }
  const onClickLeft = (serviceDateTime : Date) => {
    onUpdateOption({ placement: +!isLeft * OptionPlacement.LEFT, qualifier: optionState.qualifier }, serviceDateTime);
  }
  const onClickRight = (serviceDateTime : Date) => {
    onUpdateOption({ placement: +!isRight * OptionPlacement.RIGHT, qualifier: optionState.qualifier }, serviceDateTime);
  }
  return {
    onClickWhole,
    onClickLeft,
    onClickRight,
    onUpdateOption,
    isWhole,
    isLeft,
    isRight,
    optionState
  }
}

interface IModifierOptionCheckboxCustomizerComponent {
  option: WCPOption;
  menu: IMenu;
}

function WModifierOptionCheckboxComponent({ option, menu }: IModifierOptionCheckboxCustomizerComponent) {
  const dispatch = useAppDispatch();
  const { onClickWhole, onClickLeft, onClickRight,
    isWhole, isLeft, isRight,
    optionState } = useModifierOptionCheckbox(menu, option);
    
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const canShowAdvanced = useAppSelector(selectShowAdvanced);
  const showAdvanced = useMemo(() => canShowAdvanced && (optionState.enable_left || optionState.enable_right), [canShowAdvanced, optionState]);
  const advancedOptionSelected = useMemo(() => optionState.placement === OptionPlacement.LEFT || optionState.placement === OptionPlacement.RIGHT || optionState.qualifier !== OptionQualifier.REGULAR, [optionState.placement, optionState.qualifier]);
  if (optionState === null || serviceDateTime === null) {
    return null;
  }
  const onClickAdvanced = () => {
    dispatch(setAdvancedModifierOption([option.mt.id, option.mo.id]));
  }

  return (
    <>
      <FormControlLabel
        disableTypography
        control={
          <span className="option-circle-container">
            {!advancedOptionSelected ? <Checkbox
              className={`input-whole`}
              disabled={!optionState.enable_whole}
              checked={isWhole}
              onClick={() => onClickWhole(serviceDateTime)} /> : null}
            {isLeft || (!optionState.enable_whole && optionState.enable_left) ? <Checkbox
              className={`input-left`}
              disabled={!optionState.enable_left}
              checked={isLeft}
              onClick={() => onClickLeft(serviceDateTime)} /> : null}
            {isRight || (!optionState.enable_whole && optionState.enable_right) ? <Checkbox
              className={`input-right`}
              disabled={!optionState.enable_right}
              checked={isRight}
              onClick={() => onClickRight(serviceDateTime)} /> : null}
          </span>}
        onClick={() => {
          if (optionState.enable_whole) {
            onClickWhole(serviceDateTime);
          } else if (optionState.enable_left) {
            onClickLeft(serviceDateTime);
          } else if (optionState.enable_right) {
            onClickRight(serviceDateTime);
          }
        }}
        label={<span className='topping_text'>{option.mo.item.display_name}</span>} />
      {showAdvanced ? <IconButton onClick={onClickAdvanced} name={`${option.mo.id}_advanced`} aria-label={`${option.mo.id}_advanced`} size="small">
        <SettingsTwoTone fontSize="inherit" />
      </IconButton> : null}
    </>);
};


const FilterUnselectable = (mmEntry: MetadataModifierMapEntry, moid: string) => {
  const optionMapEntry = mmEntry.options[moid];
  return optionMapEntry.enable_left || optionMapEntry.enable_right || optionMapEntry.enable_whole;
}
interface IModifierTypeCustomizerComponent {
  menu: IMenu;
  mtid: string;
  product: WProduct;
}
export function WModifierTypeCustomizerComponent({ menu, mtid, product }: IModifierTypeCustomizerComponent) {
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const visibleOptions = useMemo(() => {
    const filterUnavailable = menu.modifiers[mtid].modifier_type.display_flags.omit_options_if_not_available;
    const mmEntry = product.m.modifier_map[mtid];
    return serviceDateTime !== null ? menu.modifiers[mtid].options_list.filter((o) => DisableDataCheck(o.mo.item.disabled, new Date(serviceDateTime)) && (!filterUnavailable || FilterUnselectable(mmEntry, o.mo.id))) : [];
  }, [menu.modifiers, mtid, product.m.modifier_map, serviceDateTime]);
  const modifierOptionsHtml = useMemo(() => {
    const mEntry = menu.modifiers[mtid];
    const mt = mEntry.modifier_type
    if (mt.max_selected === 1) {
      if (mt.min_selected === 1) {
        if (mt.display_flags.use_toggle_if_only_two_options && visibleOptions.length === 2) {
          const pcEntry = menu.product_classes[product.p.PRODUCT_CLASS.id];
          const basePI = pcEntry.instances[pcEntry.base_id];
          const mtIdX = basePI.modifiers.findIndex(x => x.modifier_type_id === mtid);
          // if we've found the modifier assigned to the base product, and the modifier option assigned to the base product is visible 
          if (mtIdX !== -1 && basePI.modifiers[mtIdX].options.length === 1) {
            const baseOptionIndex = visibleOptions.findIndex(x => x.mo.id === basePI.modifiers[mtIdX].options[0].option_id);
            if (baseOptionIndex !== -1) {
              // we togglin'!
              // since there are only two visible options, the base option is either at index 1 or 0
              return (
                <WModifierOptionToggle menu={menu} toggleOptionChecked={visibleOptions[baseOptionIndex === 0 ? 1 : 0]} toggleOptionUnchecked={visibleOptions[baseOptionIndex]} />
              );
            }
          }
          // the base product's option ${base_moid} isn't visible. switching to RADIO modifier display for ${this.mtid}`);
        }

        // return MODIFIER_DISPLAY.RADIO;
        return <WModifierRadioComponent options={visibleOptions} menu={menu} />;
      }
    }
    return <FormGroup row className="modifier flexitems" aria-labelledby={`modifier_control_${mtid}`}>{
      visibleOptions.map((option, i: number) =>
        <WModifierOptionCheckboxComponent key={i} option={option} menu={menu} />
      )}</FormGroup>
  }, [menu, mtid, product.p.PRODUCT_CLASS.id, visibleOptions]);
  return (

    // <div>{{ctrl.config.MENU.modifiers[ctrl.mtid].modifier_type.display_name ? ctrl.config.MENU.modifiers[ctrl.mtid].modifier_type.display_name : ctrl.config.MENU.modifiers[ctrl.mtid].modifier_type.name}}:</div> \
    // <div class="modifier flexitems"> \
    //   <div ng-if="ctrl.display_type !== 1" class="flexitem" ng-repeat="option in ctrl.visible_options" wcpoptiondir \
    //     selection="ctrl.selection" modctrl="ctrl" option="option" config="ctrl.config" allowadvanced="ctrl.pmenuctrl.allow_advanced"> \
    //   </div> 
    // </div>',
    <FormControl className="modifier flexitems">
      <FormLabel id={`modifier_control_${mtid}`}>{menu.modifiers[mtid].modifier_type.display_name ? menu.modifiers[mtid].modifier_type.display_name : menu.modifiers[mtid].modifier_type.name}:</FormLabel>
      {modifierOptionsHtml}
    </FormControl>
  );
}
interface IOptionDetailModal {
  menu: IMenu;
  mtid_moid: MTID_MOID;
}
function WOptionDetailModal({ menu, mtid_moid }: IOptionDetailModal) {
  const dispatch = useAppDispatch();
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const option = useMemo(() => menu.modifiers[mtid_moid[0]].options[mtid_moid[1]], [menu.modifiers, mtid_moid]);
  const { onClickWhole, onClickLeft, onClickRight, onUpdateOption,
    isWhole, isLeft, isRight,
    optionState } = useModifierOptionCheckbox(menu, option);
  const intitialOptionState = useAppSelector(s => s.customizer.advancedModifierInitialState);
  if (serviceDateTime === null) {
    return null;
  }
  const onConfirmCallback = () => {
    dispatch(setAdvancedModifierOption(null));
  }
  const onCancelCallback = () => {
    // set the modifier option state to what it was before we opened this modal
    onUpdateOption(intitialOptionState, serviceDateTime);
    onConfirmCallback();
  };

  return (
    <DialogContainer
      title={`${option.mo.item.display_name} options`}
      onClose={onCancelCallback} // TODO: handle the clicking outside the container but we've made changes in the modal case
      open={option !== null}
      inner_component={
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12}>Placement:</Grid>
          <Grid className="option-circle-container" item>
            <FormControlLabel
              disableTypography
              className="option-left option-circle"
              control={
                <Checkbox
                  className="input-left"
                  disabled={!optionState.enable_left}
                  checked={isLeft}
                  onChange={() => onClickLeft(serviceDateTime)} />
              }
              label={null}
            />
          </Grid>
          <Grid className="option-circle-container" item>
            <FormControlLabel
              className="option-whole option-circle"
              control={
                <Checkbox
                  className="input-whole"
                  disabled={!optionState.enable_whole}
                  checked={isWhole}
                  onChange={() => onClickWhole(serviceDateTime)} />
              }
              label={null}
            />
          </Grid>
          <Grid className="option-circle-container" item>
            <FormControlLabel
              className="option-right option-circle"
              control={
                <Checkbox
                  className="input-right"
                  disabled={!optionState.enable_right}
                  checked={isRight}
                  onChange={() => onClickRight(serviceDateTime)} />
              }
              label={null}
            />
          </Grid>
          <Grid container justifyContent="flex-end" item xs={12}>
            <Grid item>
              <Button onClick={onCancelCallback}>
                Cancel
              </Button>
            </Grid>
            <Grid item>
              <Button
                onClick={onConfirmCallback}>
                Confirm
              </Button>
            </Grid>
          </Grid>
        </Grid>
      }
    />);
}

const FilterModifiersCurry = function (menuModifiers: MenuModifiers) {
  return function ([mtid, entry]: [string, MetadataModifierMapEntry]) {
    const modifier_entry = menuModifiers[mtid];
    const disp_flags = modifier_entry.modifier_type.display_flags;
    const omit_section_if_no_available_options = disp_flags.omit_section_if_no_available_options;
    const hidden = disp_flags.hidden;
    // cases to not show:
    // modifier.display_flags.omit_section_if_no_available_options && (has selected item, all other options cannot be selected, currently selected items cannot be deselected)
    // modifier.display_flags.hidden is true
    return !hidden && (!omit_section_if_no_available_options || entry.has_selectable);
  };
}

interface IProductCustomizerComponent {
  menu: IMenu;
  suppressGuide: boolean;
}
export const WProductCustomizerComponent = React.forwardRef(({ menu, suppressGuide }: IProductCustomizerComponent, ref) => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const categoryId = useAppSelector(s => s.customizer.categoryId);
  const selectedProduct = useAppSelector(s => selectSelectedProduct(s));
  const cartEntry = useAppSelector(selectCartEntryBeingCustomized);
  const allowAdvancedOptionPrompt = useAppSelector(s => selectAllowAdvancedPrompt(s));
  const cart = useAppSelector(s => getCart(s.cart));
  const showAdvanced = useAppSelector(s => selectShowAdvanced(s));
  const hasAdvancedOptionSelected = useMemo(() => selectedProduct?.m.advanced_option_selected ?? false, [selectedProduct?.m.advanced_option_selected]);
  const mtid_moid = useAppSelector(s => s.customizer.advancedModifierOption);
  const customizerTitle = useMemo(() => selectedProduct !== null && selectedProduct.p.PRODUCT_CLASS.display_flags.singular_noun ? `your ${selectedProduct.p.PRODUCT_CLASS.display_flags.singular_noun}` : "it", [selectedProduct]);
  const filteredModifiers = useMemo(() => selectedProduct !== null ? Object.entries(selectedProduct.m.modifier_map).filter(FilterModifiersCurry(menu.modifiers)) : [], [selectedProduct, menu.modifiers]);
  const orderGuideMessages = useMemo(() => suppressGuide ? [] as string[] : [], [suppressGuide]);
  const orderGuideErrors = useMemo(() => selectedProduct !== null ? Object.entries(selectedProduct.m.modifier_map).reduce(
    (msgs, [mtId, v]) => v.meets_minimum ? msgs :
      [...msgs, `Please select your choice of ${String(menu.modifiers[mtId].modifier_type.display_name || menu.modifiers[mtId].modifier_type.name).toLowerCase()}`], [] as String[]) : [], [selectedProduct, menu.modifiers]);
  if (categoryId === null || selectedProduct === null) {
    return null;
  }

  const toggleAllowAdvancedOption = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setShowAdvanced(e.target.checked));
  }
  const unselectProduct = () => {
    dispatch(clearCustomizer());
  }
  const confirmCustomization = () => {
    const matchingCartEntry = FindDuplicateInCart(cart, menu.modifiers, categoryId, selectedProduct, cartEntry?.id);
    if (matchingCartEntry) {
      const amountToAdd = cartEntry?.quantity ?? 1;
      dispatch(updateCartQuantity({ id: matchingCartEntry.id, newQuantity: matchingCartEntry.quantity + amountToAdd }));
      enqueueSnackbar(`Merged duplicate ${selectedProduct.m.name} in your order.`, { variant: 'success' });
    }
    else {
      // cartEntry being undefined means it's an addition 
      if (cartEntry === undefined) {
        dispatch(addToCart({ categoryId, product: selectedProduct }))
      }
      else {
        dispatch(updateCartProduct({ id: cartEntry.id, product: selectedProduct }))
        dispatch(unlockCartEntry(cartEntry.id));
      }
      enqueueSnackbar(`Updated ${selectedProduct.m.name} in your order.`, { variant: 'success' });
    }
    // TODO: scroll to top
    unselectProduct();
  }
  return (
    <div className="customizer menu-list__items">
      { mtid_moid !== null && <WOptionDetailModal menu={menu} mtid_moid={mtid_moid} /> }
      <h3 className="flush--top">
        <strong>Customize {customizerTitle}!</strong>
      </h3>
      <div className="menu-list__item">
        <WProductComponent productMetadata={selectedProduct.m} allowAdornment={false} description dots price menuModifiers={menu.modifiers} displayContext="order" />
      </div>
      <hr className="separator" />
      {filteredModifiers.map(([mtid, modifierMapEntry], i) =>
        <WModifierTypeCustomizerComponent menu={menu} mtid={mtid} key={i} product={selectedProduct} />
      )}
      {orderGuideMessages.map((msg, i) => <div key={i} className="wpcf7-response-output wpcf7-validation-errors">{msg}</div>)}
      {orderGuideErrors.map((msg, i) => <div key={i} className="wpcf7-response-output">{msg}</div>)}
      {allowAdvancedOptionPrompt ? <FormControlLabel
        control={<Checkbox disabled={hasAdvancedOptionSelected} value={showAdvanced} onChange={toggleAllowAdvancedOption} />}
        label="I really, really want to do some advanced customization of my pizza. I absolutely know what I'm doing and won't complain if I later find out I didn't know what I was doing." /> : ""}
      <div className="order-nav">
        <Grid container justifyContent="flex-end" item xs={12}>
          <Grid item>
            <Button className="btn button-remove" onClick={unselectProduct}>
              Cancel
            </Button>
          </Grid>
          <Grid item>
            <Button className="btn" disabled={!selectedProduct || selectedProduct.m.incomplete || orderGuideErrors.length > 0}
              onClick={confirmCustomization}>
              {cartEntry === undefined ? "Add to order" : "Save changes"}
            </Button>
          </Grid>
        </Grid>
      </div>
    </div>
  );
})