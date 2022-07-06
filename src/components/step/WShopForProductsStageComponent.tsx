import React, { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import { ExpandMore } from "@mui/icons-material";
import { PIZZAS_CATID, EXTRAS_CATID } from '../../config';
import { StepNav, WProduct } from '../common';
import { WProductComponent } from '../WProductComponent';
import { WOrderCart } from '../WOrderCartComponent';
import { CreateWCPProductFromPI, FilterEmptyCategories, FilterProduct, IMenu, IProductInstance } from '@wcp/wcpshared';
import { customizeProduct, selectSelectedProduct } from '../WCustomizerSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { WProductCustomizerComponent } from '../WProductCustomizerComponent';
import { GetSelectableModifiers, IProductInstancesSelectors, IProductsSelectors } from '../../app/store';
import { getCart, updateCartQuantity, addToCart, FindDuplicateInCart } from '../WCartSlice';
import useMenu from '../../app/useMenu';


const FilterEmptyCategoriesWrapper = function (menu: IMenu, order_time: Date) {
  return FilterEmptyCategories(menu, function (x: any) { return x.order.hide; }, order_time);
};

// NOTE: any calls to this are going to need the order_time properly piped because right now it's just getting the fulfillment.dt.day
const FilterProductWrapper = function (menu: IMenu, order_time: Date) {
  return (item: IProductInstance) => FilterProduct(item, menu, function (x: any) { return x.order.hide; }, order_time)
};

const ComputeExtrasCategories = (menu: IMenu | null, time: Date): string[] => {
  return menu !== null && menu.categories[EXTRAS_CATID].children.length ? menu.categories[EXTRAS_CATID].children.filter(FilterEmptyCategoriesWrapper(menu, time)) : []
}

export function WShopForProductsStage({ navComp } : { navComp : StepNav }) {
  const { menu } = useMenu();
  const { enqueueSnackbar } = useSnackbar();
  const selectProductClassById = useAppSelector(s => (id: string) => IProductsSelectors.selectById(s, id));
  const selectProductInstanceById = useAppSelector(s => (id: string) => IProductInstancesSelectors.selectById(s, id));
  const isComplete = useAppSelector(s => s.customizer.selectedProduct === null && s.cart.ids.length > 0);
  const cart = useAppSelector(s => getCart(s.cart));
  const serviceDateTime = useAppSelector(s => s.fulfillment.dateTime);
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const dispatch = useAppDispatch();
  const [menuStage, setMenuStage] = useState<"MAIN" | "SECONDARY">("MAIN");
  const [activePanel, setActivePanel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [extrasCategories, setExtrasCategories] = useState<string[]>([]);
  const ProductsForCategoryFilteredAndSorted = useCallback((category: string) => serviceDateTime !== null && menu !== null ? menu.categories[category].menu.filter(FilterProductWrapper(menu, new Date(serviceDateTime))).sort((p) => p.display_flags.order.ordinal) : [], [menu, serviceDateTime]);

  // reinitialize the accordion if the expanded s still in range 
  useEffect(() => {
    if (serviceDateTime !== null) {
      const extras = ComputeExtrasCategories(menu, new Date(serviceDateTime));
      if (extras.length !== extrasCategories.length) {
        setActivePanel(0);
        setExtrasCategories(extras);
      }
    }
  }, [extrasCategories.length, serviceDateTime, menu]);

  if (menu === null || serviceDateTime === null) {
    return <div>How'd you end up here!?</div>;
  }

  const onProductSelection = (e: React.MouseEvent, cid: string, pid: string) => {
    e.preventDefault();
    // either dispatch to the customizer or to the cart

    const productInstance = selectProductInstanceById(pid);
    if (productInstance) {
      const productClass = selectProductClassById(productInstance.product_id);
      if (productClass) {
        const productCopy: WProduct = { p: CreateWCPProductFromPI(productClass, productInstance, menu.modifiers), m: structuredClone(menu.product_instance_metadata[pid]) };
        const productHasSelectableModifiers = Object.values(GetSelectableModifiers(productCopy.m.modifier_map, menu)).length > 0;
        if ((productInstance.display_flags?.order.skip_customization) || !productHasSelectableModifiers) {
          const matchInCart = FindDuplicateInCart(cart, menu.modifiers, cid, productCopy);
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
          // TODO: scroll to top of product customizer
        }
      }
    }
  }


  const toggleAccordion = (i: number) => {
    if (activePanel === i) {
      setIsExpanded(!isExpanded);
    }
    else {
      setActivePanel(i);
      setIsExpanded(true);
    }
  }

  return (
    <div>
      <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{cart.length > 0 ? "Click a pizza below or next to continue." : "Click a pizza below to get started"}</Typography>
      {menuStage === "MAIN" && selectedProduct === null ? (
        <div className="ordering-menu menu-list menu-list__dotted">
          <ul className="flexitems menu-list__items">
            {ProductsForCategoryFilteredAndSorted(PIZZAS_CATID).map((p: IProductInstance, i: number) =>
              <li key={i} className="flexitem menu-list__item">
                <div className="offer-link" onClick={(e) => onProductSelection(e, PIZZAS_CATID, p._id)}>
                  <WProductComponent productMetadata={menu.product_instance_metadata[p._id]} allowAdornment description dots price menuModifiers={menu.modifiers} displayContext="order" />
                </div>
              </li>)}
          </ul>
        </div>) : null}
      {menuStage === "SECONDARY" && selectedProduct === null ? (
        <div>
          <h3 className="flush--top"><strong>Add small plates or beverages to your order.</strong></h3>
          {extrasCategories.map((subcatid: string, i: number) =>
            <Accordion key={i} expanded={activePanel === i && isExpanded} onChange={() => toggleAccordion(i)} className="ordering-menu menu-list menu-list__dotted" >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography sx={{ ml: 4 }}><span dangerouslySetInnerHTML={{ __html: menu.categories[subcatid].menu_name }} /></Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ul className="menu-list__items">
                  {menu.categories[subcatid].subtitle ? <li className="menu-list__item"><strong><span dangerouslySetInnerHTML={{ __html: menu.categories[subcatid].subtitle || "" }}></span></strong></li> : ""}
                  {ProductsForCategoryFilteredAndSorted(subcatid).map((p: IProductInstance, j: number) =>
                    <li key={j} className="menu-list__item">
                      <div className="offer-link" onClick={(e) => onProductSelection(e, subcatid, p._id)}>
                        <WProductComponent productMetadata={menu.product_instance_metadata[p._id]} allowAdornment description dots price menuModifiers={menu.modifiers} displayContext="order" />
                      </div>
                    </li>)}
                </ul>
              </AccordionDetails>
            </Accordion>)}
        </div>) : null}
      {selectedProduct !== null ? (<WProductCustomizerComponent menu={menu} suppressGuide={false} />) : null}
      <WOrderCart isProductEditDialogOpen menu={menu} />
      {selectedProduct === null && navComp(() => { return }, isComplete, true)}
    </div>
  );
}

// WShopForProductsStage.Stage = {
//   stepperTitle: "Add items",
//   isComplete: (s: RootState) => s.customizer.selectedProduct === null && s.cart.ids.length > 0,
//   content: WShopForProductsStage
// }


