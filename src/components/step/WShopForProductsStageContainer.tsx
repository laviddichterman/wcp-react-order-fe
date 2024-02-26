import { useCallback, useMemo, useState } from 'react';
import { useSnackbar } from 'notistack';
import { CartEntry, WProduct, CreateWCPProduct } from '@wcp/wcpshared';
import { customizeProduct, editCartEntry } from '../../app/slices/WCustomizerSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { WProductCustomizerComponent } from '../WProductCustomizerComponent';
import { GetSelectableModifiers, SelectMainCategoryId, SelectMainProductCategoryCount, selectSelectedProduct, SelectSupplementalCategoryId } from '../../app/store';
import { getCart, updateCartQuantity, addToCart, FindDuplicateInCart, lockCartEntry } from '../../app/slices/WCartSlice';
import { nextStage, backStage } from '../../app/slices/StepperSlice';
import { Navigation } from '../Navigation';
import { WOrderCart } from '../WOrderCartComponent';
import { WShopForProductsStage } from './WShopForProductsStageComponent';
import { cloneDeep } from 'lodash';
import { setTimeToFirstProductIfUnset } from '../../app/slices/WMetricsSlice';
import { Separator, getProductEntryById, getProductInstanceById, scrollToIdOffsetAfterDelay, StageTitle, getModifierTypeEntryById } from '@wcp/wario-ux-shared';

export interface WShopForProductsStageProps {
  categoryId: string;
  onProductSelection: (returnToId: string, cid: string, pid: string) => void;
}

export function WShopForProductsContainer({ productSet }: { productSet: 'PRIMARY' | 'SECONDARY' }) {
  const [scrollToOnReturn, setScrollToOnReturn] = useState('WARIO_order');
  const numMainCategoryProducts = useAppSelector(SelectMainProductCategoryCount);
  const mainCategoryId = useAppSelector(SelectMainCategoryId)!;
  const supplementalCategoryId = useAppSelector(SelectSupplementalCategoryId)!;
  const modiferEntrySelector = useAppSelector(s => (id: string) => getModifierTypeEntryById(s.ws.modifierEntries, id));
  const menu = useAppSelector(s => s.ws.menu!);
  const { enqueueSnackbar } = useSnackbar();
  const productEntrySelector = useAppSelector(s => (id: string) => getProductEntryById(s.ws.products, id));
  const productInstanceSelector = useAppSelector(s => (id: string) => getProductInstanceById(s.ws.productInstances, id));
  const cart = useAppSelector(s => getCart(s.cart.cart));
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const dispatch = useAppDispatch();
  const titleString = useMemo(() => productSet === 'PRIMARY' ?
    (numMainCategoryProducts > 0 ? "Click a pizza below or next to continue." : "Click a pizza below to get started.") :
    'Add small plates and other stuff to your order.',
    [productSet, numMainCategoryProducts]);

  const onProductSelection = useCallback((returnToId: string, cid: string, pid: string) => {
    // either dispatch to the customizer or to the cart

    const productInstance = productInstanceSelector(pid);
    if (productInstance) {
      const productEntry = productEntrySelector(productInstance.productId);
      if (productEntry) {
        const productCopy: WProduct = { p: CreateWCPProduct(productEntry.product, productInstance.modifiers), m: cloneDeep(menu!.product_instance_metadata[pid]) };
        const productHasSelectableModifiers = Object.values(GetSelectableModifiers(productCopy.m.modifier_map, menu!)).length > 0;
        if ((!productCopy.m.incomplete && productInstance.displayFlags.order.skip_customization) || !productHasSelectableModifiers) {
          const matchInCart = FindDuplicateInCart(cart, modiferEntrySelector, cid, productCopy);
          if (matchInCart !== null) {
            enqueueSnackbar(`Changed ${productCopy.m.name} quantity to ${matchInCart.quantity + 1}.`, { variant: 'success' });
            dispatch(updateCartQuantity({ id: matchInCart.id, newQuantity: matchInCart.quantity + 1 }));
          }
          else {
            // it's a new entry!
            enqueueSnackbar(`Added ${productCopy.m.name} to order.`, { variant: 'success', autoHideDuration: 3000, disableWindowBlurListener: true });
            dispatch(setTimeToFirstProductIfUnset(Date.now()));
            dispatch(addToCart({ categoryId: cid, product: productCopy }));
          }
        }
        else {
          // add to the customizer
          dispatch(customizeProduct({ product: productCopy, categoryId: cid }));
          scrollToIdOffsetAfterDelay('WARIO_order', 0);
        }
      }
      setScrollToOnReturn(returnToId);
    }
  }, [cart, dispatch, enqueueSnackbar, menu, productEntrySelector, productInstanceSelector, modiferEntrySelector]);

  const setProductToEdit = useCallback((entry: CartEntry) => {
    dispatch(lockCartEntry(entry.id));
    dispatch(editCartEntry(entry));
    scrollToIdOffsetAfterDelay('WARIO_order', 100);
    setScrollToOnReturn('orderCart');
  }, [dispatch, setScrollToOnReturn]);

  return (
    <div>
      <div hidden={selectedProduct !== null}>
        <StageTitle>{titleString}</StageTitle>
        <Separator sx={{ pb: 3 }} />
        {productSet === 'PRIMARY' ?
          <WShopForProductsStage
            categoryId={mainCategoryId}
            onProductSelection={onProductSelection}
          /> :
          <WShopForProductsStage
            categoryId={supplementalCategoryId!}
            onProductSelection={onProductSelection}
          />}
      </div>
      {selectedProduct !== null && (<WProductCustomizerComponent scrollToWhenDone={scrollToOnReturn} />)}
      {cart.length > 0 && <Separator />}
      <WOrderCart isProductEditDialogOpen={selectedProduct !== null} setProductToEdit={setProductToEdit} />
      {selectedProduct === null && <Navigation canBack canNext={numMainCategoryProducts > 0} handleBack={() => dispatch(backStage())} handleNext={() => dispatch(nextStage())} />}
    </div>
  );
}