import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Grid, Typography } from '@mui/material';
import { ExpandMore } from "@mui/icons-material";
import { ClickableProductDisplay } from '../WProductComponent';
import { IProductInstance } from '@wcp/wcpshared';
import { useAppSelector } from '../../app/useHooks';
import { SelectSupplementalCategoryId } from '../../app/store';
import { SelectServiceDateTime } from '../../app/slices/WFulfillmentSlice';
import { scrollToElementOffsetAfterDelay } from '../../utils/shared';
import { FilterEmptyCategoriesWrapper, WShopForProductsStageProps } from './WShopForProductsStageContainer';
import { Separator, StageTitle } from '../styled/styled';

export function WShopForSuppProductsStage({ ProductsForCategoryFilteredAndSorted, onProductSelection, hidden }: WShopForProductsStageProps) {
  // TODO: we need to handle if this is null by choice. how to we bypass this stage?
  const SUPP_CATID = useAppSelector(SelectSupplementalCategoryId);
  const menu = useAppSelector(s => s.ws.menu!);
  const selectedService = useAppSelector(s=>s.fulfillment.selectedService);
  const serviceDateTime = useAppSelector(s => SelectServiceDateTime(s.fulfillment));
  const [activePanel, setActivePanel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [extrasCategories, setExtrasCategories] = useState<string[]>([]);


  // reinitialize the accordion if the expanded is still in range 
  useEffect(() => {
    if (serviceDateTime !== null && selectedService !== null && SUPP_CATID !== null) {
      const extras = menu.categories[SUPP_CATID].children.length ? menu.categories[SUPP_CATID].children.filter(FilterEmptyCategoriesWrapper(menu, serviceDateTime, selectedService)) : [];
      if (extras.length !== extrasCategories.length) {
        setActivePanel(0);
        setExtrasCategories(extras);
      }
    }
  }, [SUPP_CATID, extrasCategories.length, serviceDateTime, menu, selectedService]);

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
    <div hidden={hidden}>
      <StageTitle>Add small plates or beverages to your order.</StageTitle>
      <Separator sx={{ pb: 3 }} />
      {extrasCategories.map((catId, i) =>
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
                    menuModifiers={menu!.modifiers}
                    displayContext="order"
                  />
                </Grid>)}
            </Grid>
          </AccordionDetails>
        </Accordion>)}
    </div>
  );
}