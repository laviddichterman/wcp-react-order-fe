import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Grid, Typography } from '@mui/material';
import { ExpandMore } from "@mui/icons-material";
import { ClickableProductDisplay } from '../WProductComponent';
import { FilterEmptyCategories, FilterProduct, IMenu, IProductInstance } from '@wcp/wcpshared';
import { useAppSelector } from '../../app/useHooks';
import { SelectServiceDateTime } from '../../app/slices/WFulfillmentSlice';
import { WShopForProductsStageProps } from './WShopForProductsStageContainer';
import { scrollToElementOffsetAfterDelay } from '@wcp/wario-ux-shared';

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


export function WShopForProductsStage({ categoryId, onProductSelection }: WShopForProductsStageProps) {
  // TODO: we need to handle if this is null by choice. how to we bypass this stage?
  const menu = useAppSelector(s => s.ws.menu!);
  const selectedService = useAppSelector(s => s.fulfillment.selectedService!);
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const [activePanel, setActivePanel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [subCategories, setSubCategories] = useState<string[]>([]);
  const ProductsForCategoryFilteredAndSorted = useCallback((category: string) =>
    ProductsForCategoryFilteredAndSortedFxnGen(menu, serviceDateTime, selectedService)(category),
    [menu, serviceDateTime, selectedService]);

  // reinitialize the accordion if the expanded is still in range 
  useEffect(() => {
    if (serviceDateTime !== null && selectedService !== null && categoryId !== null) {
      const extras = menu.categories[categoryId].children.length ? menu.categories[categoryId].children.filter(FilterEmptyCategoriesWrapper(menu, serviceDateTime, selectedService)) : [];
      if (extras.length !== subCategories.length) {
        setActivePanel(0);
        setSubCategories(extras);
      }
    }
  }, [categoryId, subCategories.length, serviceDateTime, menu, selectedService]);

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
    <>
      <Grid container>
        {ProductsForCategoryFilteredAndSorted(categoryId).map((p: IProductInstance, i: number) =>
          <Grid item xs={12} md={6} lg={4} xl={3} key={i} >
            <ClickableProductDisplay
              sx={{ mb: 3.75, mx: 2 }}
              onClick={(e) => onProductSelection('WARIO_order', categoryId, p.id)}
              productMetadata={menu.product_instance_metadata[p.id]}
              allowAdornment
              description
              dots
              price
              displayContext="order"
            />
          </Grid>)}
      </Grid>
      {subCategories.map((catId, i) =>
        <Accordion id={`accordion-${catId}`} key={i} expanded={activePanel === i && isExpanded} onChange={(e) => toggleAccordion(e, i)} >
          <AccordionSummary expandIcon={activePanel === i && isExpanded ? <ExpandMore /> : <ExpandMore />}>
            <Typography variant='h5' sx={{ ml: 4 }}><span dangerouslySetInnerHTML={{ __html: menu!.categories[catId].menu_name }} /></Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container>
              {menu.categories[catId].subtitle &&
                <Grid item xs={12}>
                  <Typography variant='body1' dangerouslySetInnerHTML={{ __html: menu!.categories[catId].subtitle || "" }}></Typography>
                </Grid>}
              {ProductsForCategoryFilteredAndSorted(catId).map((p: IProductInstance, j: number) =>
                <Grid item xs={12} sx={{ pt: 2.5, pb: 1, px: 0.25 }} key={j}>
                  <ClickableProductDisplay
                    onClick={() => onProductSelection(`accordion-${catId}`, catId, p.id)}
                    productMetadata={menu!.product_instance_metadata[p.id]}
                    allowAdornment
                    description
                    dots
                    price
                    displayContext="order"
                  />
                </Grid>)}
            </Grid>
          </AccordionDetails>
        </Accordion>)}
    </>
  );
}