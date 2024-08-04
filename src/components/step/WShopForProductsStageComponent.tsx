import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Grid, Typography, BoxProps } from '@mui/material';
import { ExpandMore } from "@mui/icons-material";
import { ClickableProductDisplay } from '../WProductComponent';
import { useAppDispatch, useAppSelector } from '../../app/useHooks';
import { SelectServiceDateTime } from '../../app/slices/WFulfillmentSlice';
import { WShopForProductsStageProps } from './WShopForProductsStageContainer';
import { getModifierTypeEntryById, getProductEntryById, getProductInstanceById, scrollToElementOffsetAfterDelay, scrollToIdOffsetAfterDelay, SelectPopulatedSubcategoryIdsInCategory, SelectProductInstanceIdsInCategory, SelectProductMetadata, SocketIoState } from '@wcp/wario-ux-shared';
import { RootState, SelectMenuNameFromCategoryById, SelectMenuSubtitleFromCategoryById, SelectProductInstanceHasSelectableModifiersByProductInstanceId, SelectProductMetadataFromProductInstanceIdWithCurrentFulfillmentData } from '../../app/store';
import { CreateWCPProduct, WProduct } from '@wcp/wcpshared';
import { cloneDeep } from 'lodash';
import { addToCart, FindDuplicateInCart, getCart, updateCartQuantity } from '../../app/slices/WCartSlice';
import { enqueueSnackbar } from 'notistack';
import { customizeProduct } from '../../app/slices/WCustomizerSlice';
import { setTimeToFirstProductIfUnset } from '../../app/slices/WMetricsSlice';

export interface ShopClickableProductDisplayProps {
  productInstanceId: string;
  returnToId: string;
  sourceCategoryId: string;
  setScrollToOnReturn: (value: React.SetStateAction<string>) => void
};


function ShopClickableProductDisplay({ productInstanceId, returnToId, sourceCategoryId, setScrollToOnReturn, ...props }: ShopClickableProductDisplayProps & BoxProps) {
  const dispatch = useAppDispatch();
  const productEntrySelector = useAppSelector(s => (id: string) => getProductEntryById(s.ws.products, id));
  const modiferEntrySelector = useAppSelector(s => (id: string) => getModifierTypeEntryById(s.ws.modifierEntries, id));
  const cart = useAppSelector(s => getCart(s.cart.cart));
  const productInstance = useAppSelector(s => getProductInstanceById(s.ws.productInstances, productInstanceId));
  const productMetadata = useAppSelector(s => SelectProductMetadataFromProductInstanceIdWithCurrentFulfillmentData(s, productInstanceId));
  const productHasSelectableModifiers = useAppSelector(s => SelectProductInstanceHasSelectableModifiersByProductInstanceId(s, productInstanceId));
  const onProductSelection = useCallback(() => {
    // either dispatch to the customizer or to the cart
    if (productInstance && productMetadata) {
      const productCopy: WProduct = { p: CreateWCPProduct(productInstance.productId, productInstance.modifiers), m: cloneDeep(productMetadata) };
      if ((!productCopy.m.incomplete && productInstance.displayFlags.order.skip_customization) || !productHasSelectableModifiers) {
        const matchInCart = FindDuplicateInCart(cart, modiferEntrySelector, productEntrySelector, sourceCategoryId, productCopy.p);
        if (matchInCart !== null) {
          enqueueSnackbar(`Changed ${productCopy.m.name} quantity to ${matchInCart.quantity + 1}.`, { variant: 'success' });
          dispatch(updateCartQuantity({ id: matchInCart.id, newQuantity: matchInCart.quantity + 1 }));
        }
        else {
          // it's a new entry!
          enqueueSnackbar(`Added ${productCopy.m.name} to order.`, { variant: 'success', autoHideDuration: 3000, disableWindowBlurListener: true });
          dispatch(setTimeToFirstProductIfUnset(Date.now()));
          dispatch(addToCart({ categoryId: sourceCategoryId, product: productCopy }));
        }
      }
      else {
        // add to the customizer
        dispatch(customizeProduct({ product: productCopy, categoryId: sourceCategoryId }));
        scrollToIdOffsetAfterDelay('WARIO_order', 0);
      }
      setScrollToOnReturn(returnToId);
    }
  }, [cart, dispatch, enqueueSnackbar, productEntrySelector, modiferEntrySelector]);

  return <ClickableProductDisplay
    {...props}
    onClick={onProductSelection}
    productMetadata={productMetadata}
    allowAdornment
    description
    dots
    price
    displayContext="order"
  />
}

interface AccordionSubCategoryProps {
  activePanel: number;
  isExpanded: boolean;
  toggleAccordion: (event: React.SyntheticEvent<Element, Event>, i: number) => void,
  index: number;
}

function AccordionSubCategory({ categoryId, activePanel, isExpanded, toggleAccordion, index, setScrollToOnReturn }: WShopForProductsStageProps & AccordionSubCategoryProps) {
  const selectedService = useAppSelector(s => s.fulfillment.selectedService!);
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const productInstancesIdsInCategory = useAppSelector(s => SelectProductInstanceIdsInCategory(s.ws.categories, s.ws.products, s.ws.productInstances, s.ws.modifierOptions, categoryId, 'Order', serviceDateTime!, selectedService));
  const menuName = useAppSelector(s => SelectMenuNameFromCategoryById(s.ws.categories, categoryId));
  const subtitle = useAppSelector(s => SelectMenuSubtitleFromCategoryById(s.ws.categories, categoryId));
  return (<Accordion id={`accordion-${categoryId}`} key={index} expanded={activePanel === index && isExpanded} onChange={(e) => toggleAccordion(e, index)} >
    <AccordionSummary expandIcon={activePanel === index && isExpanded ? <ExpandMore /> : <ExpandMore />}>
      <Typography variant='h5' sx={{ ml: 4 }}><span dangerouslySetInnerHTML={{ __html: menuName }} /></Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Grid container>
        {subtitle &&
          <Grid item xs={12}>
            <Typography variant='body1' dangerouslySetInnerHTML={{ __html: subtitle }}></Typography>
          </Grid>}
        {productInstancesIdsInCategory.map((pIId: string, j: number) =>
          <Grid item xs={12} sx={{ pt: 2.5, pb: 1, px: 0.25 }} key={j}>
            <ShopClickableProductDisplay 
              returnToId={`accordion-${categoryId}`} 
              setScrollToOnReturn={setScrollToOnReturn} 
              sourceCategoryId={categoryId}
              productInstanceId={pIId}
            />
          </Grid>)}
      </Grid>
    </AccordionDetails>
  </Accordion>);
}

export function WShopForProductsStage({ categoryId, setScrollToOnReturn }: WShopForProductsStageProps) {
  // TODO: we need to handle if this is null by choice. how to we bypass this stage?
  const selectedService = useAppSelector(s => s.fulfillment.selectedService!);
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const populatedSubcategories = useAppSelector(s => SelectPopulatedSubcategoryIdsInCategory(s.ws.categories, s.ws.products, s.ws.productInstances, s.ws.modifierOptions, categoryId, 'Order', serviceDateTime!, selectedService));
  const productInstancesIdsInCategory = useAppSelector(s => SelectProductInstanceIdsInCategory(s.ws.categories, s.ws.products, s.ws.productInstances, s.ws.modifierOptions, categoryId, 'Order', serviceDateTime!, selectedService));
  const [activePanel, setActivePanel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  // reinitialize the accordion if the expanded is still in range 
  useEffect(() => {
    if (activePanel >= populatedSubcategories.length) {
      setActivePanel(0);
    }
  }, [populatedSubcategories, activePanel]);

  const toggleAccordion = useCallback((event: React.SyntheticEvent<Element, Event>, i: number) => {
    event.preventDefault();
    const ref = event.currentTarget;
    if (activePanel === i) {
      if (isExpanded) {
        setIsExpanded(false);
        scrollToElementOffsetAfterDelay(ref, 200, 'center');
        return;
      }
    }
    setActivePanel(i);
    setIsExpanded(true);
    scrollToElementOffsetAfterDelay(ref, 450, 'start');
  }, [activePanel, isExpanded]);

  return (
    <Grid container>
      {productInstancesIdsInCategory.map((pIId: string, i: number) =>
        <Grid item xs={12} md={6} lg={4} xl={3} key={i} >
          <ShopClickableProductDisplay
            sx={{ mb: 3.75, mx: 2 }}
            returnToId={'WARIO_order'} 
            setScrollToOnReturn={setScrollToOnReturn} 
            sourceCategoryId={categoryId}
            productInstanceId={pIId}
          />
        </Grid>)}

      {populatedSubcategories.map((catId, i) =>
        <AccordionSubCategory 
          key={i}
          categoryId={catId} 
          setScrollToOnReturn={setScrollToOnReturn} 
          activePanel={activePanel} 
          index={i} 
          isExpanded={isExpanded} 
          toggleAccordion={toggleAccordion} />
      )}
    </Grid>
  );
}