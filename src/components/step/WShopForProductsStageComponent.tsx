import React, { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import { ExpandMore } from "@mui/icons-material";
import { WProductComponent } from '../WProductComponent';
import { CreateWCPProductFromPI, WProduct, FilterEmptyCategories, FilterProduct, IMenu, IProductInstance } from '@wcp/wcpshared';
import { customizeProduct, editCartEntry, selectSelectedProduct } from '../../app/slices/WCustomizerSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { WProductCustomizerComponent } from '../WProductCustomizerComponent';
import { GetSelectableModifiers, IProductInstancesSelectors, IProductsSelectors, SelectMainCategoryId, SelectMainProductCategoryCount, SelectSupplementalCategoryId } from '../../app/store';
import { getCart, updateCartQuantity, addToCart, FindDuplicateInCart, lockCartEntry } from '../../app/slices/WCartSlice';
import { SelectServiceDateTime } from '../../app/slices/WFulfillmentSlice';
import { nextStage, backStage } from '../../app/slices/StepperSlice';
import { Navigation } from '../Navigation';
import { scrollToElementAfterDelay, scrollToIdAfterDelay } from '../../utils/shared';
import { CartEntry } from '../common';
import { WOrderCart } from '../WOrderCartComponent';


const FilterEmptyCategoriesWrapper = function (menu: IMenu, order_time: Date | number) {
  return FilterEmptyCategories(menu, function (x: any) { return x.order.hide; }, order_time);
};

// NOTE: any calls to this are going to need the order_time properly piped because right now it's just getting the fulfillment.dt.day
const FilterProductWrapper = function (menu: IMenu, order_time: Date | number) {
  return (item: IProductInstance) => FilterProduct(item, menu, function (x: any) { return x.order.hide; }, order_time)
};

export function WShopForProductsStage() {
  const [scrollToOnReturn, setScrollToOnReturn] = React.useState<string>('topOfShop');
  const MAIN_CATID = useAppSelector(SelectMainCategoryId);
  const SUPP_CATID = useAppSelector(SelectSupplementalCategoryId);
  const numMainCategoryProducts = useAppSelector(SelectMainProductCategoryCount);
  const menu = useAppSelector(s => s.ws.menu);
  const { enqueueSnackbar } = useSnackbar();
  const selectProductClassById = useAppSelector(s => (id: string) => IProductsSelectors.selectById(s, id));
  const selectProductInstanceById = useAppSelector(s => (id: string) => IProductInstancesSelectors.selectById(s, id));
  const cart = useAppSelector(s => getCart(s.cart.cart));
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const dispatch = useAppDispatch();
  const [menuStage, setMenuStage] = useState<"MAIN" | "SECONDARY">("MAIN");
  const [activePanel, setActivePanel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [extrasCategories, setExtrasCategories] = useState<string[]>([]);
  const ProductsForCategoryFilteredAndSorted = useCallback((category: string) =>
    serviceDateTime !== null && menu !== null ?
      menu.categories[category].menu.filter(FilterProductWrapper(menu, serviceDateTime)).sort((p) => p.display_flags.order.ordinal) : [], [menu, serviceDateTime]);
  const HandleNext = useCallback(() => {
    if (menuStage === 'MAIN') {
      setMenuStage('SECONDARY');
      scrollToIdAfterDelay('topOfShop', 100);
    }
    else {
      dispatch(nextStage())
    }
  }, [dispatch, setMenuStage, menuStage]);
  const HandleBack = useCallback(() => {
    if (menuStage === 'SECONDARY') {
      setMenuStage('MAIN');
      scrollToIdAfterDelay('topOfShop', 100);
    }
    else {
      dispatch(backStage())
    }
  }, [dispatch, setMenuStage, menuStage]);

  // reinitialize the accordion if the expanded is still in range 
  useEffect(() => {
    if (serviceDateTime !== null && menu !== null) {
      const extras = menu.categories[SUPP_CATID].children.length ? menu.categories[SUPP_CATID].children.filter(FilterEmptyCategoriesWrapper(menu, serviceDateTime)) : [];
      if (extras.length !== extrasCategories.length) {
        setActivePanel(0);
        setExtrasCategories(extras);
      }
    }
  }, [SUPP_CATID, extrasCategories.length, serviceDateTime, menu]);

  const onProductSelection = useCallback((returnToId: string, cid: string, pid: string) => {
    // either dispatch to the customizer or to the cart

    const productInstance = selectProductInstanceById(pid);
    if (productInstance) {
      const productClass = selectProductClassById(productInstance.product_id);
      if (productClass) {
        const productCopy: WProduct = { p: CreateWCPProductFromPI(productClass, productInstance, menu!.modifiers), m: structuredClone(menu!.product_instance_metadata[pid]) };
        const productHasSelectableModifiers = Object.values(GetSelectableModifiers(productCopy.m.modifier_map, menu!)).length > 0;
        if ((productInstance.display_flags?.order.skip_customization) || !productHasSelectableModifiers) {
          const matchInCart = FindDuplicateInCart(cart, menu!.modifiers, cid, productCopy);
          if (matchInCart !== null) {
            enqueueSnackbar(`Changed ${productCopy.m.name} quantity to ${matchInCart.quantity + 1}.`, { variant: 'success' });
            dispatch(updateCartQuantity({ id: matchInCart.id, newQuantity: matchInCart.quantity + 1 }));

          }
          else {
            // it's a new entry!
            enqueueSnackbar(`Added ${productCopy.m.name} to order.`, { variant: 'success' });
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

  const toggleAccordion = useCallback((event: React.SyntheticEvent<Element, Event>, i: number) => {
    event.preventDefault();
    const ref = event.currentTarget;
    if (activePanel === i) {
      if (isExpanded) {
        setIsExpanded(false);
        scrollToElementAfterDelay(ref, 200, 'center');
        return;
      }
    }
    setActivePanel(i);
    setIsExpanded(true);
    scrollToElementAfterDelay(ref, 450);
  }, [activePanel, isExpanded]);
  if (menu === null) {
    return <>Loading...</>
  }

  return (
    <div id="topOfShop">
      {menuStage === "MAIN" && selectedProduct === null && (
        <>
          {selectedProduct === null && <Typography variant="h5" className="flush--top" sx={{  mt: 2, mb: 1, fontWeight: 'bold' }}>{numMainCategoryProducts > 0 ? "Click a pizza below or next to continue." : "Click a pizza below to get started"}</Typography>}
          <div className="ordering-menu menu-list menu-list__dotted">
            <ul className="flexitems menu-list__items">
              {ProductsForCategoryFilteredAndSorted(MAIN_CATID).map((p: IProductInstance, i: number) =>
                <li key={i} className="flexitem menu-list__item">
                  <div className="offer-link" onClick={(e) => onProductSelection('topOfShop', MAIN_CATID, p.id)}>
                    <WProductComponent productMetadata={menu!.product_instance_metadata[p.id]} allowAdornment description dots price menuModifiers={menu!.modifiers} displayContext="order" />
                  </div>
                </li>)}
            </ul>
          </div>
        </>)}
      {menuStage === "SECONDARY" && selectedProduct === null ? (
        <div>
          <Typography variant="h5" className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>Add small plates or beverages to your order.</Typography>
          {extrasCategories.map((catId, i) =>
            <Accordion id={`accordion-${catId}`} key={i} expanded={activePanel === i && isExpanded} onChange={(e) => toggleAccordion(e, i)} className="ordering-menu menu-list menu-list__dotted" >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ ml: 4 }}><span dangerouslySetInnerHTML={{ __html: menu!.categories[catId].menu_name }} /></Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ul className="menu-list__items">
                  {menu!.categories[catId].subtitle ? <li className="menu-list__item"><strong><span dangerouslySetInnerHTML={{ __html: menu!.categories[catId].subtitle || "" }}></span></strong></li> : ""}
                  {ProductsForCategoryFilteredAndSorted(catId).map((p: IProductInstance, j: number) =>
                    <li key={j} className="menu-list__item">
                      <div className="offer-link" onClick={() => onProductSelection(`accordion-${catId}`, catId, p.id)}>
                        <WProductComponent 
                          productMetadata={menu!.product_instance_metadata[p.id]} 
                          allowAdornment 
                          description 
                          dots 
                          price 
                          menuModifiers={menu!.modifiers} 
                          displayContext="order" />
                      </div>
                    </li>)}
                </ul>
              </AccordionDetails>
            </Accordion>)}
        </div>) : null}
      {selectedProduct !== null ? (<WProductCustomizerComponent menu={menu!} scrollToWhenDone={scrollToOnReturn} />) : null}
      <WOrderCart isProductEditDialogOpen={selectedProduct !== null} menu={menu!} setProductToEdit={setProductToEdit} />
      <Navigation canBack={selectedProduct === null} canNext={selectedProduct === null && numMainCategoryProducts > 0} handleBack={HandleBack} handleNext={HandleNext} />
    </div>
  );
}