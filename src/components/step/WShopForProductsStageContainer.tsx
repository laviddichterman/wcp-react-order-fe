import React, { useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { CartEntry, CreateWCPProductFromPI, WProduct, FilterProduct, IMenu, IProductInstance } from '@wcp/wcpshared';
import { customizeProduct, editCartEntry } from '../../app/slices/WCustomizerSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { WProductCustomizerComponent } from '../WProductCustomizerComponent';
import { GetSelectableModifiers, IProductInstancesSelectors, IProductsSelectors, SelectMainProductCategoryCount, selectSelectedProduct } from '../../app/store';
import { getCart, updateCartQuantity, addToCart, FindDuplicateInCart, lockCartEntry } from '../../app/slices/WCartSlice';
import { SelectServiceDateTime } from '../../app/slices/WFulfillmentSlice';
import { nextStage, backStage } from '../../app/slices/StepperSlice';
import { Navigation } from '../Navigation';
import { scrollToIdAfterDelay } from '../../utils/shared';
import { WOrderCart } from '../WOrderCartComponent';
import { WShopForPrimaryProductsStage } from './WShopForPrimaryProductsStageComponent';
import { WShopForSuppProductsStage } from './WShopForSuppProductsStageComponent';

// NOTE: any calls to this are going to need the order_time properly piped because right now it's just getting the fulfillment.dt.day
const FilterProductWrapper = function (menu: IMenu, order_time: Date | number) {
  return (item: IProductInstance) => FilterProduct(item, menu, function (x: any) { return x.order.hide; }, order_time)
};

export const ProductsForCategoryFilteredAndSortedFxnGen = function(menu: IMenu | null, serviceDateTime: Date | null) {
  return serviceDateTime !== null && menu !== null ? 
    ((category: string) => menu.categories[category].menu.filter(FilterProductWrapper(menu, serviceDateTime)).sort((p) => p.display_flags.order.ordinal)) : 
    ((_: string) => []) 
}
export interface WShopForProductsStageProps {
  ProductsForCategoryFilteredAndSorted: (category: string) => IProductInstance[];
  onProductSelection: (returnToId: string, cid: string, pid: string) => void;
}

export function WShopForProductsContainer({productSet} : { productSet: 'PRIMARY' | 'SECONDARY' }) {
  const [scrollToOnReturn, setScrollToOnReturn] = React.useState<string>('topOfShop');
  const numMainCategoryProducts = useAppSelector(SelectMainProductCategoryCount);
  const menu = useAppSelector(s => s.ws.menu!);
  const { enqueueSnackbar } = useSnackbar();
  const selectProductClassById = useAppSelector(s => (id: string) => IProductsSelectors.selectById(s, id));
  const selectProductInstanceById = useAppSelector(s => (id: string) => IProductInstancesSelectors.selectById(s, id));
  const cart = useAppSelector(s => getCart(s.cart.cart));
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const dispatch = useAppDispatch();
  const ProductsForCategoryFilteredAndSorted = useCallback((category: string) => 
    ProductsForCategoryFilteredAndSortedFxnGen(menu, serviceDateTime)(category), 
    [menu, serviceDateTime]);


  const onProductSelection = useCallback((returnToId: string, cid: string, pid: string) => {
    // either dispatch to the customizer or to the cart

    const productInstance = selectProductInstanceById(pid);
    if (productInstance) {
      const productClass = selectProductClassById(productInstance.product_id);
      if (productClass) {
        const productCopy: WProduct = { p: CreateWCPProductFromPI(productClass, productInstance, menu.modifiers), m: structuredClone(menu!.product_instance_metadata[pid]) };
        const productHasSelectableModifiers = Object.values(GetSelectableModifiers(productCopy.m.modifier_map, menu!)).length > 0;
        if ((productInstance.display_flags?.order.skip_customization) || !productHasSelectableModifiers) {
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
          scrollToIdAfterDelay('topOfShop', 0);
        }
      }
      setScrollToOnReturn(returnToId);
    }
  }, [cart, dispatch, enqueueSnackbar, menu, selectProductClassById, selectProductInstanceById]);

  const setProductToEdit = useCallback((entry: CartEntry) => {
    dispatch(lockCartEntry(entry.id));
    dispatch(editCartEntry(entry));
    scrollToIdAfterDelay('topOfShop', 100);
    setScrollToOnReturn('orderCart');
  }, [dispatch, setScrollToOnReturn]);

  return (
    <div id="topOfShop">
      {selectedProduct === null && (
        productSet ==='PRIMARY' ? 
          <WShopForPrimaryProductsStage onProductSelection={onProductSelection} ProductsForCategoryFilteredAndSorted={ProductsForCategoryFilteredAndSorted} /> : 
          <WShopForSuppProductsStage onProductSelection={onProductSelection} ProductsForCategoryFilteredAndSorted={ProductsForCategoryFilteredAndSorted} />)} 
      {selectedProduct !== null && (<WProductCustomizerComponent menu={menu!} scrollToWhenDone={scrollToOnReturn} />)}
      <WOrderCart isProductEditDialogOpen={selectedProduct !== null} menu={menu!} setProductToEdit={setProductToEdit} />
      {selectedProduct === null && <Navigation canBack canNext={numMainCategoryProducts > 0} handleBack={()=>dispatch(backStage())} handleNext={()=>dispatch(nextStage())} />}
    </div>
  );
}