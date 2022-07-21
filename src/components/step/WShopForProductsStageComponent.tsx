import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSnackbar } from 'notistack';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import { ExpandMore } from "@mui/icons-material";
import { WProductComponent } from '../WProductComponent';
import { WOrderCart } from '../WOrderCartComponent';
import { CreateWCPProductFromPI, WProduct, FilterEmptyCategories, FilterProduct, IMenu, IProductInstance } from '@wcp/wcpshared';
import { customizeProduct, selectSelectedProduct } from '../../app/slices/WCustomizerSlice';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { WProductCustomizerComponent } from '../WProductCustomizerComponent';
import { GetSelectableModifiers, IProductInstancesSelectors, IProductsSelectors, SelectMainCategoryId, SelectMainProductCategoryCount, SelectSupplementalCategoryId } from '../../app/store';
import { getCart, updateCartQuantity, addToCart, FindDuplicateInCart } from '../../app/slices/WCartSlice';
import useMenu from '../../app/useMenu';
import { SelectServiceDateTime } from '../../app/slices/WFulfillmentSlice';
import { nextStage, backStage } from '../../app/slices/StepperSlice';
import { Navigation } from '../Navigation';


const FilterEmptyCategoriesWrapper = function (menu: IMenu, order_time: Date | number) {
  return FilterEmptyCategories(menu, function (x: any) { return x.order.hide; }, order_time);
};

// NOTE: any calls to this are going to need the order_time properly piped because right now it's just getting the fulfillment.dt.day
const FilterProductWrapper = function (menu: IMenu, order_time: Date) {
  return (item: IProductInstance) => FilterProduct(item, menu, function (x: any) { return x.order.hide; }, order_time)
};



export function WShopForProductsStage() {
  const topOfCustomizerRef = useRef();
  const MAIN_CATID = useAppSelector(SelectMainCategoryId);
  const SUPP_CATID = useAppSelector(SelectSupplementalCategoryId);
  const numMainCategoryProducts = useAppSelector(SelectMainProductCategoryCount);
  const { menu } = useMenu()!;
  const { enqueueSnackbar } = useSnackbar();
  const selectProductClassById = useAppSelector(s => (id: string) => IProductsSelectors.selectById(s, id));
  const selectProductInstanceById = useAppSelector(s => (id: string) => IProductInstancesSelectors.selectById(s, id));
  const cart = useAppSelector(s => getCart(s.cart));
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const selectedProduct = useAppSelector(selectSelectedProduct);
  const dispatch = useAppDispatch();
  const [menuStage, setMenuStage] = useState<"MAIN" | "SECONDARY">("MAIN");
  const [activePanel, setActivePanel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [extrasCategories, setExtrasCategories] = useState<string[]>([]);
  const ProductsForCategoryFilteredAndSorted = useCallback((category: string) => serviceDateTime !== null && menu !== null ? menu.categories[category].menu.filter(FilterProductWrapper(menu, new Date(serviceDateTime))).sort((p) => p.display_flags.order.ordinal) : [], [menu, serviceDateTime]);

  const HandleNext = () => {
    if (menuStage === 'MAIN') {
      setMenuStage('SECONDARY');
    }
    else {
      dispatch(nextStage())
    }
  }
  const HandleBack = () => {
    if (menuStage === 'SECONDARY') {
      setMenuStage('MAIN');
    }
    else {
      dispatch(backStage())
    }
  }

  // reinitialize the accordion if the expanded is still in range 
  useEffect(() => {
    const ComputeExtrasCategories = (menu: IMenu | null, time: Date | number): string[] => {
      return menu !== null && menu.categories[SUPP_CATID].children.length ? menu.categories[SUPP_CATID].children.filter(FilterEmptyCategoriesWrapper(menu, time)) : []
    }
    if (serviceDateTime !== null) {
      const extras = ComputeExtrasCategories(menu, serviceDateTime  );
      if (extras.length !== extrasCategories.length) {
        setActivePanel(0);
        setExtrasCategories(extras);
      }
    }
  }, [SUPP_CATID, extrasCategories.length, serviceDateTime, menu]);

  const onProductSelection = (e: React.MouseEvent, cid: string, pid: string) => {
    e.preventDefault();
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
          // TODO: scroll to top of product customizer
        }
      }
    }
  }
  //console.log(topOfCustomizerRef);

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
      {selectedProduct === null && <Typography className="flush--top" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>{numMainCategoryProducts > 0 ? "Click a pizza below or next to continue." : "Click a pizza below to get started"}</Typography>}
      {menuStage === "MAIN" && selectedProduct === null ? (
        <div className="ordering-menu menu-list menu-list__dotted">
          <ul className="flexitems menu-list__items">
            {ProductsForCategoryFilteredAndSorted(MAIN_CATID).map((p: IProductInstance, i: number) =>
              <li key={i} className="flexitem menu-list__item">
                <div className="offer-link" onClick={(e) => onProductSelection(e, MAIN_CATID, p.id)}>
                  <WProductComponent productMetadata={menu!.product_instance_metadata[p.id]} allowAdornment description dots price menuModifiers={menu!.modifiers} displayContext="order" />
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
                <Typography sx={{ ml: 4 }}><span dangerouslySetInnerHTML={{ __html: menu!.categories[subcatid].menu_name }} /></Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ul className="menu-list__items">
                  {menu!.categories[subcatid].subtitle ? <li className="menu-list__item"><strong><span dangerouslySetInnerHTML={{ __html: menu!.categories[subcatid].subtitle || "" }}></span></strong></li> : ""}
                  {ProductsForCategoryFilteredAndSorted(subcatid).map((p: IProductInstance, j: number) =>
                    <li key={j} className="menu-list__item">
                      <div className="offer-link" onClick={(e) => onProductSelection(e, subcatid, p.id)}>
                        <WProductComponent productMetadata={menu!.product_instance_metadata[p.id]} allowAdornment description dots price menuModifiers={menu!.modifiers} displayContext="order" />
                      </div>
                    </li>)}
                </ul>
              </AccordionDetails>
            </Accordion>)}
        </div>) : null}
      {selectedProduct !== null ? (<WProductCustomizerComponent ref={topOfCustomizerRef} menu={menu!} suppressGuide={false} />) : null}
      <WOrderCart isProductEditDialogOpen menu={menu!} />
      {selectedProduct === null && <Navigation canBack canNext={numMainCategoryProducts > 0} handleBack={HandleBack} handleNext={HandleNext} />}
    </div>
  );
}

// WShopForProductsStage.Stage = {
//   stepperTitle: "Add items",
//   isComplete: (s: RootState) => s.customizer.selectedProduct === null && s.cart.ids.length > 0,
//   content: WShopForProductsStage
// }


