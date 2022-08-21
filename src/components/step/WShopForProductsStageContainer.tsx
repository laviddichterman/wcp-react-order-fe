import React, { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { CartEntry, WProduct, FilterProduct, IMenu, IProductInstance, FilterEmptyCategories, CreateWCPProduct } from '@wcp/wcpshared';
import { customizeProduct, editCartEntry } from '../../app/slices/WCustomizerSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { WProductCustomizerComponent } from '../WProductCustomizerComponent';
import { GetSelectableModifiers, IProductInstancesSelectors, IProductsSelectors, SelectMainProductCategoryCount, selectSelectedProduct } from '../../app/store';
import { getCart, updateCartQuantity, addToCart, FindDuplicateInCart, lockCartEntry } from '../../app/slices/WCartSlice';
import { SelectServiceDateTime } from '../../app/slices/WFulfillmentSlice';
import { nextStage, backStage } from '../../app/slices/StepperSlice';
import { Navigation } from '../Navigation';
import { scrollToIdOffsetAfterDelay } from '../../utils/shared';
import { WOrderCart } from '../WOrderCartComponent';
import { WShopForPrimaryProductsStage } from './WShopForPrimaryProductsStageComponent';
import { WShopForSuppProductsStage } from './WShopForSuppProductsStageComponent';
import { Separator } from '../styled/styled';
import { cloneDeep } from 'lodash';

export interface OrderHideable { 
  order: {
    hide: boolean;
  };
}
// NOTE: any calls to this are going to need the order_time properly piped because right now it's just getting the fulfillment.dt.day
export const FilterProductWrapper = function <T extends OrderHideable>(menu: IMenu, order_time: Date | number, fulfillmentId: string) {
  return (item: IProductInstance) => FilterProduct(item, menu, (x: T) => x.order.hide, order_time, fulfillmentId)
};

export const FilterEmptyCategoriesWrapper = function <T extends OrderHideable>(menu: IMenu, order_time: Date | number, fulfillmentId: string) {
  return FilterEmptyCategories(menu, (x: T) => x.order.hide, order_time, fulfillmentId);
};

export const ProductsForCategoryFilteredAndSortedFxnGen = function (menu: IMenu | null, serviceDateTime: Date | null, fulfillmentId: string) {
  return serviceDateTime !== null && menu !== null ?
    ((category: string) => menu.categories[category].menu.filter(FilterProductWrapper(menu, serviceDateTime, fulfillmentId)).sort((p) => p.displayFlags.order.ordinal)) :
    ((_: string) => [])
}
export interface WShopForProductsStageProps {
  ProductsForCategoryFilteredAndSorted: (category: string) => IProductInstance[];
  onProductSelection: (returnToId: string, cid: string, pid: string) => void;
  hidden: boolean;
}

export function WShopForProductsContainer({ productSet }: { productSet: 'PRIMARY' | 'SECONDARY' }) {
  const [scrollToOnReturn, setScrollToOnReturn] = React.useState<string>('WARIO_order');
  const numMainCategoryProducts = useAppSelector(SelectMainProductCategoryCount);
  const selectedService = useAppSelector(s=>s.fulfillment.selectedService!);
  const menu = useAppSelector(s => s.ws.menu!);
  const { enqueueSnackbar } = useSnackbar();
  const selectProductClassById = useAppSelector(s => (id: string) => IProductsSelectors.selectById(s, id));
  const selectProductInstanceById = useAppSelector(s => (id: string) => IProductInstancesSelectors.selectById(s, id));
  const cart = useAppSelector(s => getCart(s.cart.cart));
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const dispatch = useAppDispatch();
  const ProductsForCategoryFilteredAndSorted = useCallback((category: string) =>
    ProductsForCategoryFilteredAndSortedFxnGen(menu, serviceDateTime, selectedService)(category),
    [menu, serviceDateTime, selectedService]);


  const onProductSelection = useCallback((returnToId: string, cid: string, pid: string) => {
    // either dispatch to the customizer or to the cart

    const productInstance = selectProductInstanceById(pid);
    if (productInstance) {
      const productClass = selectProductClassById(productInstance.productId);
      if (productClass) {
        const productCopy: WProduct = { p: CreateWCPProduct(productClass, productInstance.modifiers), m: cloneDeep(menu!.product_instance_metadata[pid]) };
        const productHasSelectableModifiers = Object.values(GetSelectableModifiers(productCopy.m.modifier_map, menu!)).length > 0;
        if ((productInstance.displayFlags.order.skip_customization) || !productHasSelectableModifiers) {
          const matchInCart = FindDuplicateInCart(cart, menu.modifiers, cid, productCopy);
          if (matchInCart !== null) {
            enqueueSnackbar(`Changed ${productCopy.m.name} quantity to ${matchInCart.quantity + 1}.`, { variant: 'success' });
            dispatch(updateCartQuantity({ id: matchInCart.id, newQuantity: matchInCart.quantity + 1 }));
          }
          else {
            // it's a new entry!
            enqueueSnackbar(`Added ${productCopy.m.name} to order.`, { variant: 'success', autoHideDuration: 3000, disableWindowBlurListener: true });
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
  }, [cart, dispatch, enqueueSnackbar, menu, selectProductClassById, selectProductInstanceById]);

  const setProductToEdit = useCallback((entry: CartEntry) => {
    dispatch(lockCartEntry(entry.id));
    dispatch(editCartEntry(entry));
    scrollToIdOffsetAfterDelay('WARIO_order', 100);
    setScrollToOnReturn('orderCart');
  }, [dispatch, setScrollToOnReturn]);

  return (
    <div>
      { productSet === 'PRIMARY' ?
          <WShopForPrimaryProductsStage hidden={selectedProduct !== null} onProductSelection={onProductSelection} ProductsForCategoryFilteredAndSorted={ProductsForCategoryFilteredAndSorted} /> :
          <WShopForSuppProductsStage hidden={selectedProduct !== null} onProductSelection={onProductSelection} ProductsForCategoryFilteredAndSorted={ProductsForCategoryFilteredAndSorted} />}
      {selectedProduct !== null && (<WProductCustomizerComponent scrollToWhenDone={scrollToOnReturn} />)}
      {cart.length > 0 && <Separator />}
      <WOrderCart isProductEditDialogOpen={selectedProduct !== null} setProductToEdit={setProductToEdit} />
      {selectedProduct === null && <Navigation canBack canNext={numMainCategoryProducts > 0} handleBack={() => dispatch(backStage())} handleNext={() => dispatch(nextStage())} />}
    </div>
  );
}