import React, { forwardRef, useCallback, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { FormControl, FormControlProps, FormGroup, FormLabel, Radio, RadioGroup, Grid, Button, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import { SettingsTwoTone, Circle, CircleOutlined } from "@mui/icons-material";
import { ProductDisplay } from './WProductComponent';
import { getProductInstanceFunctionById } from '../app/slices/SocketIoSlice';
import { WProduct, MenuModifiers, MetadataModifierMapEntry, WCPOption, DisableDataCheck, OptionPlacement, OptionQualifier, IOptionState, MTID_MOID, ICatalog, DISABLE_REASON, IProductInstanceFunction, WFunctional, WCPProduct } from '@wcp/wcpshared';
import {
  clearCustomizer,
  setAdvancedModifierOption,
  setShowAdvanced,
  updateModifierOptionStateCheckbox,
  updateModifierOptionStateToggleOrRadio
} from '../app/slices/WCustomizerSlice';
import {
  selectAllowAdvancedPrompt,
  selectCartEntryBeingCustomized,
  selectOptionState,
  selectSelectedProduct,
  selectShowAdvanced
} from '../app/store';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import DialogContainer from './dialog.container';
import { addToCart, FindDuplicateInCart, getCart, unlockCartEntry, updateCartProduct, updateCartQuantity } from '../app/slices/WCartSlice';
import { SelectServiceDateTime } from '../app/slices/WFulfillmentSlice';
import { scrollToIdOffsetAfterDelay } from '../utils/shared';
import { CustomizerFormControlLabel, ErrorResponseOutput, OkResponseOutput, Separator, StageTitle, WarioButton, WarningResponseOutput } from './styled/styled';
import { ModifierOptionTooltip } from './ModifierOptionTooltip';

interface IModifierOptionToggle {
  toggleOptionChecked: WCPOption;
  toggleOptionUnchecked: WCPOption;
}

function WModifierOptionToggle({ toggleOptionChecked, toggleOptionUnchecked }: IModifierOptionToggle) {
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
      moId: e.target.checked ? toggleOptionChecked.mo.id : toggleOptionUnchecked.mo.id
    }));
  }
  return (
    <ModifierOptionTooltip 
      option={optionValue ? toggleOptionUnchecked : toggleOptionChecked} 
      enableState={optionValue ? optionUncheckedState.enable_whole : optionUncheckedState.enable_whole}
    >
    <CustomizerFormControlLabel
      control={<Checkbox
        checkedIcon={<Circle />}
        icon={<CircleOutlined />}
        disableRipple
        disableFocusRipple
        disableTouchRipple
        disabled={(optionValue ? optionUncheckedState.enable_whole : optionUncheckedState.enable_whole).enable !== DISABLE_REASON.ENABLED}
        value={optionValue}
        onChange={toggleOption} />}
      label={toggleOptionChecked.mo.item.display_name} />
      </ModifierOptionTooltip>
  );
}

interface IModifierRadioCustomizerComponent {
  options: WCPOption[];
};

export function WModifierRadioComponent({ options }: IModifierRadioCustomizerComponent) {
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
      moId: e.target.value
    }));
  }
  return (
    <RadioGroup
      sx={{ width: '100%' }}
      onChange={onChange}
      value={modifierOptionState.length === 1 ? modifierOptionState[0].option_id : null}
      aria-labelledby={`modifier_control_${options[0].mt.id}`}>
      <Grid container>
        {options.map((opt, i) => {
          const optionState = getOptionState(opt.mo.id);
          return (<Grid item xs={12} sm={6} md={4} lg={3} key={i}>
            <ModifierOptionTooltip option={opt} enableState={optionState.enable_whole} >
              <CustomizerFormControlLabel
                value={opt.mo.id}
                control={<Radio
                  checkedIcon={<Circle />}
                  icon={<CircleOutlined />}
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  disabled={optionState.enable_whole.enable !== DISABLE_REASON.ENABLED}
                />}
                label={opt.mo.item.display_name} />
            </ModifierOptionTooltip>
          </Grid>)
        })}
      </Grid>
    </RadioGroup>);
};

function useModifierOptionCheckbox(option: WCPOption) {
  const dispatch = useAppDispatch();
  const menu = useAppSelector(s => s.ws.menu!);
  const optionState = useAppSelector(selectOptionState)(option.mt.id, option.mo.id);
  const isWhole = useMemo(() => optionState.placement === OptionPlacement.WHOLE, [optionState.placement]);
  const isLeft = useMemo(() => optionState.placement === OptionPlacement.LEFT, [optionState.placement]);
  const isRight = useMemo(() => optionState.placement === OptionPlacement.RIGHT, [optionState.placement]);
  const onUpdateOption = (newState: IOptionState, serviceDateTime: Date) => {
    dispatch(updateModifierOptionStateCheckbox({
      mt: option.mt,
      mo: option.mo,
      optionState: newState,
      menu
    }));
  };
  const onClickWhole = (serviceDateTime: Date) => {
    onUpdateOption({ placement: +!isWhole * OptionPlacement.WHOLE, qualifier: optionState.qualifier }, serviceDateTime);
  }
  const onClickLeft = (serviceDateTime: Date) => {
    onUpdateOption({ placement: +!isLeft * OptionPlacement.LEFT, qualifier: optionState.qualifier }, serviceDateTime);
  }
  const onClickRight = (serviceDateTime: Date) => {
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
}

function WModifierOptionCheckboxComponent({ option }: IModifierOptionCheckboxCustomizerComponent) {
  const dispatch = useAppDispatch();
  const { onClickWhole, onClickLeft, onClickRight,
    isWhole, isLeft, isRight,
    optionState } = useModifierOptionCheckbox(option);

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
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <ModifierOptionTooltip option={option} enableState={optionState.enable_whole} >
        <CustomizerFormControlLabel
          disabled={optionState.enable_whole.enable !== DISABLE_REASON.ENABLED}
          control={
            <span>
              {!advancedOptionSelected &&
                <Checkbox
                  checkedIcon={<Circle />}
                  icon={<CircleOutlined />}
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  //className={`input-whole`}
                  disabled={optionState.enable_whole.enable !== DISABLE_REASON.ENABLED}
                  checked={isWhole}
                  onClick={() => onClickWhole(serviceDateTime)} />}
              {(isLeft || (optionState.enable_whole.enable !== DISABLE_REASON.ENABLED && optionState.enable_left.enable === DISABLE_REASON.ENABLED)) &&
                <Checkbox
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  //className={`input-left`}
                  disabled={optionState.enable_left.enable !== DISABLE_REASON.ENABLED}
                  checked={isLeft}
                  onClick={() => onClickLeft(serviceDateTime)} />}
              {(isRight || (optionState.enable_whole.enable !== DISABLE_REASON.ENABLED && optionState.enable_right.enable === DISABLE_REASON.ENABLED)) &&
                <Checkbox
                  disableRipple
                  disableFocusRipple
                  disableTouchRipple
                  //className={`input-right`}
                  disabled={optionState.enable_right.enable !== DISABLE_REASON.ENABLED}
                  checked={isRight}
                  onClick={() => onClickRight(serviceDateTime)} />}
            </span>}
          // onClick={() => {
          //   console.log(optionState)

          // }}
          label={option.mo.item.display_name} />
        {showAdvanced ? <IconButton onClick={onClickAdvanced} name={`${option.mo.id}_advanced`} aria-label={`${option.mo.id}_advanced`} size="small">
          <SettingsTwoTone fontSize="inherit" />
        </IconButton> : null}
      </ModifierOptionTooltip>
    </Grid>);
};


const FilterUnselectable = (mmEntry: MetadataModifierMapEntry, moid: string) => {
  const optionMapEntry = mmEntry.options[moid];
  return optionMapEntry.enable_left.enable === DISABLE_REASON.ENABLED || optionMapEntry.enable_right.enable === DISABLE_REASON.ENABLED || optionMapEntry.enable_whole.enable === DISABLE_REASON.ENABLED;
}
interface IModifierTypeCustomizerComponent {
  mtid: string;
  product: WProduct;
}
export function WModifierTypeCustomizerComponent({ mtid, product, ...other }: IModifierTypeCustomizerComponent & Omit<FormControlProps, 'children'>) {
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const menu = useAppSelector(s => s.ws.menu!);
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
                <WModifierOptionToggle toggleOptionChecked={visibleOptions[baseOptionIndex === 0 ? 1 : 0]} toggleOptionUnchecked={visibleOptions[baseOptionIndex]} />
              );
            }
          }
          // the base product's option ${base_moid} isn't visible. switching to RADIO modifier display for ${this.mtid}`);
        }

        // return MODIFIER_DISPLAY.RADIO;
        return <WModifierRadioComponent options={visibleOptions} />;
      }
    }
    return <FormGroup row aria-labelledby={`modifier_control_${mtid}`}>{
      visibleOptions.map((option, i: number) =>
        <WModifierOptionCheckboxComponent key={i} option={option} />
      )}</FormGroup>
  }, [menu, mtid, product.p.PRODUCT_CLASS.id, visibleOptions]);
  return (
    <FormControl fullWidth {...other}>
      <FormLabel id={`modifier_control_${mtid}`}>
        {menu.modifiers[mtid].modifier_type.display_name ? menu.modifiers[mtid].modifier_type.display_name : menu.modifiers[mtid].modifier_type.name}:
      </FormLabel>
      {modifierOptionsHtml}
    </FormControl>);
}
interface IOptionDetailModal {
  mtid_moid: MTID_MOID;
}
function WOptionDetailModal({ mtid_moid }: IOptionDetailModal) {
  const dispatch = useAppDispatch();
  const menu = useAppSelector(s => s.ws.menu!);
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const option = useMemo(() => menu.modifiers[mtid_moid[0]].options[mtid_moid[1]], [menu.modifiers, mtid_moid]);
  const { onClickWhole, onClickLeft, onClickRight, onUpdateOption,
    isWhole, isLeft, isRight,
    optionState } = useModifierOptionCheckbox(option);
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
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  disabled={!optionState.enable_left}
                  checked={isLeft}
                  onChange={() => onClickLeft(serviceDateTime)} />
              }
              label={null}
            />
          </Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
                  disabled={!optionState.enable_whole}
                  checked={isWhole}
                  onChange={() => onClickWhole(serviceDateTime)} />
              }
              label={null}
            />
          </Grid>
          <Grid item>
            <FormControlLabel
              control={
                <Checkbox
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
interface ProcessOrderGuideProps { 
  product: WCPProduct;
  catalog: ICatalog;
  pifGetter: (id: string) => IProductInstanceFunction | undefined;
  guide: string[]
}
const ProcessOrderGuide = function({ catalog, product, pifGetter, guide } : ProcessOrderGuideProps) {
  return guide.map(x=>pifGetter(x)).reduce((acc, x) => {
    if (x !== undefined) {
      const result = WFunctional.ProcessProductInstanceFunction(product, x, catalog);
      if (result) {
        return [...acc, result as string];
      }
    }
    return acc;
  }, [] as string[])
}

interface IProductCustomizerComponentProps {
  suppressGuide?: boolean;
  scrollToWhenDone: string;
}
export const WProductCustomizerComponent = forwardRef<HTMLDivElement, IProductCustomizerComponentProps>(({ suppressGuide, scrollToWhenDone }, ref) => {
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useAppDispatch();
  const menu = useAppSelector(s => s.ws.menu!);
  const SelectProductInstanceFunctionById = useAppSelector(s=>(id : string)=>getProductInstanceFunctionById(s.ws.productInstanceFunctions, id));
  const catalog = useAppSelector(s=>s.ws.catalog!);
  const categoryId = useAppSelector(s => s.customizer.categoryId);
  const selectedProduct = useAppSelector(s => selectSelectedProduct(s));
  const cartEntry = useAppSelector(selectCartEntryBeingCustomized);
  const allowAdvancedOptionPrompt = useAppSelector(s => selectAllowAdvancedPrompt(s));
  const cart = useAppSelector(s => getCart(s.cart.cart));
  const showAdvanced = useAppSelector(s => selectShowAdvanced(s));
  const hasAdvancedOptionSelected = useMemo(() => selectedProduct?.m.advanced_option_selected ?? false, [selectedProduct?.m.advanced_option_selected]);
  const mtid_moid = useAppSelector(s => s.customizer.advancedModifierOption);
  const customizerTitle = useMemo(() => selectedProduct !== null && selectedProduct.p.PRODUCT_CLASS.display_flags.singular_noun ? `your ${selectedProduct.p.PRODUCT_CLASS.display_flags.singular_noun}` : "it", [selectedProduct]);
  const filteredModifiers = useMemo(() => selectedProduct !== null ? Object.entries(selectedProduct.m.modifier_map).filter(FilterModifiersCurry(menu.modifiers)) : [], [selectedProduct, menu.modifiers]);
  const orderGuideMessages = useMemo(() => suppressGuide || selectedProduct === null ? [] : ProcessOrderGuide({ catalog, product: selectedProduct.p, guide: selectedProduct.p.PRODUCT_CLASS.display_flags.order_guide.suggestions, pifGetter: SelectProductInstanceFunctionById}), [catalog, selectedProduct, suppressGuide, SelectProductInstanceFunctionById]);
  const orderGuideWarnings = useMemo(() => selectedProduct === null ? [] : ProcessOrderGuide({ catalog, product: selectedProduct.p, guide: selectedProduct.p.PRODUCT_CLASS.display_flags.order_guide.warnings, pifGetter: SelectProductInstanceFunctionById}), [catalog, selectedProduct, SelectProductInstanceFunctionById]);
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
    scrollToIdOffsetAfterDelay(scrollToWhenDone, 200);
    if (cartEntry) {
      dispatch(unlockCartEntry(cartEntry.id));
    }
    dispatch(clearCustomizer());
  }
  const confirmCustomization = () => {
    const matchingCartEntry = FindDuplicateInCart(cart, menu.modifiers, categoryId, selectedProduct, cartEntry?.id);
    if (matchingCartEntry) {
      const amountToAdd = cartEntry?.quantity ?? 1;
      const newQuantity = matchingCartEntry.quantity + amountToAdd;
      dispatch(updateCartQuantity({ id: matchingCartEntry.id, newQuantity }));
      enqueueSnackbar(cartEntry ? `Merged duplicate ${selectedProduct.m.name} in your order.` : `Updated quantity of ${selectedProduct.m.name} to ${newQuantity}`, { variant: 'success', autoHideDuration: 3000 });
    }
    else {
      // cartEntry being undefined means it's an addition 
      if (cartEntry === undefined) {
        dispatch(addToCart({ categoryId, product: selectedProduct }))
        enqueueSnackbar(`Added ${selectedProduct.m.name} to your order.`, { variant: 'success', autoHideDuration: 3000, disableWindowBlurListener: true });
      }
      else {
        dispatch(updateCartProduct({ id: cartEntry.id, product: selectedProduct }))
        dispatch(unlockCartEntry(cartEntry.id));
        enqueueSnackbar(`Updated ${selectedProduct.m.name} in your order.`, { variant: 'success', autoHideDuration: 3000, disableWindowBlurListener: true });
      }
    }
    unselectProduct();
  }
  return (
    <div ref={ref}>
      {mtid_moid !== null && <WOptionDetailModal mtid_moid={mtid_moid} />}
      <StageTitle>Customize {customizerTitle}!</StageTitle>
      <Separator sx={{ pb: 3 }} />
      <ProductDisplay productMetadata={selectedProduct.m} description price menuModifiers={menu.modifiers} displayContext="order" />
      <Separator />
      <Grid container>
        {filteredModifiers.map(([mtid, _], i) =>
          <Grid item container key={i} xs={12}><WModifierTypeCustomizerComponent mtid={mtid} product={selectedProduct} /></Grid>
        )}
      </Grid>
      {orderGuideMessages.map((msg, i) => <OkResponseOutput key={`${i}guide`}>{msg}</OkResponseOutput>)}
      {orderGuideWarnings.map((msg, i) => <WarningResponseOutput key={`${i}warnguide`}>{msg}</WarningResponseOutput>)}
      {orderGuideErrors.map((msg, i) => <ErrorResponseOutput key={`${i}err`}>{msg}</ErrorResponseOutput>)}
      {allowAdvancedOptionPrompt ? <FormControlLabel
        control={<Checkbox disabled={hasAdvancedOptionSelected} value={showAdvanced} onChange={toggleAllowAdvancedOption} />}
        label="I really, really want to do some advanced customization of my pizza. I absolutely know what I'm doing and won't complain if I later find out I didn't know what I was doing." /> : ""}
      <Grid container item xs={12} sx={{ py: 3, flexDirection: 'row-reverse' }}>
        <Grid item sx={{ display: "flex", width: "200px", justifyContent: "flex-end" }}>
          <WarioButton disabled={!selectedProduct || selectedProduct.m.incomplete || orderGuideErrors.length > 0}
            onClick={confirmCustomization}>
            {cartEntry === undefined ? "Add to order" : "Save changes"}
          </WarioButton>
        </Grid>
        <Grid item xs={4} sx={{ display: "flex", justifyContent: "flex-end" }}>
          <WarioButton onClick={unselectProduct}>
            Cancel
          </WarioButton>
        </Grid>

        <Grid item xs sx={{ display: 'flex' }} />
      </Grid>
    </div>
  );
})