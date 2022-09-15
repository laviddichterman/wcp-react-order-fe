import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ProductDisplay } from '../WProductComponent';
import { WModifiersComponent } from './WModifiersComponent';
import { useAppDispatch, useAppSelector } from "../../app/useHooks";
import { Box, Tab, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab'
import { IMenu, CategoryEntry, IProductInstance, FilterProduct, FilterWMenu, WDateUtils, CategoryDisplay, MoneyToDisplayString } from '@wcp/wcpshared';
import { GetNextAvailableServiceDateTime, SelectDefaultFulfillmentId, SelectMenuCategoryId } from '../../app/store';
import { getProductEntryById, LoadingScreen } from '@wcp/wario-ux-shared';
import { Separator } from '../styled/styled';
import { cloneDeep } from 'lodash';
import { setService } from '../../app/slices/WFulfillmentSlice';
import { isNonProduction, scrollToElementOffsetAfterDelay } from '../../utils/shared';
import { ExpandMore } from '@mui/icons-material';

import { DataGridPro, DataGridProProps, GridColumns, GridValueGetterParams } from '@mui/x-data-grid-pro';
import {
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps
} from '@mui/x-data-grid';

interface WMenuDisplayProps { menu: IMenu; category: CategoryEntry; };

const DataGridMetadataPrefix = "DG_";

type IProductInstanceValueGetter = GridValueGetterParams<any, IProductInstance>;
function WMenuDataGrid({ menu, category }: WMenuDisplayProps) {
  const productEntrySelector = useAppSelector(s => (id: string) => getProductEntryById(s.ws.products, id));
  const productRows = useMemo(() => [...category.menu, ...category.children.map(x => menu.categories[x].menu).flat()], [menu, category]);
  const dynamicColumns: GridColumns<IProductInstance> = useMemo(() => {
    const acc: Record<string, boolean> = {};
    productRows.forEach((pi) => pi.externalIDs.forEach(md => {
      if (md.key.startsWith(DataGridMetadataPrefix)) {
        acc[md.key.slice(DataGridMetadataPrefix.length)] = true;
      }
    }));
    //{ headerName: "Ordinal", field: "ordinal", valueGetter: (v: ValueGetterRow) => v.row.category.ordinal, flex: 3 },

    return Object.keys(acc).map(x=>({ headerName: x, field: x, valueGetter: (v: IProductInstanceValueGetter) => v.row.externalIDs.find(ext=> ext.key === `DG_${x}`)?.value ?? "" }));
  }, [productRows]);
  return <DataGridPro
    density="compact"
    hideFooter
    autoHeight
    disableColumnReorder
    columns={[
      {headerName: "Name", field: "name", valueGetter: (v:IProductInstanceValueGetter)=> v.row.displayName },
      {headerName: "Price", field: "price", valueGetter: (v:IProductInstanceValueGetter)=> MoneyToDisplayString(productEntrySelector(v.row.productId)!.product.price, false) },
      ...dynamicColumns ]}
    rows={productRows}
  />
}
// return (
//   <Box>
//     {category.children.map((subSection) => {
//       const subCategory = menu.categories[subSection];
//       return (
//         <Box sx={{ pt: 4 }} key={subSection}>
//           <Typography variant="h4" sx={{ ml: 2 }} dangerouslySetInnerHTML={{ __html: subCategory.menu_name }} />
//           <Separator />
//           <WMenuRecursive menu={menu} category={subCategory} />
//         </Box>)
//     })}
//     <WMenuSection menu={menu} category={category} />
//   </Box>);
// }

function WMenuSection({ menu, category }: WMenuDisplayProps) {
  const productEntrySelector = useAppSelector(s => (id: string) => getProductEntryById(s.ws.products, id));
  return (
    <Box sx={{ pt: 0 }}>
      {category.subtitle !== null &&
        <Typography variant="h6" dangerouslySetInnerHTML={{ __html: category.subtitle }} />
      }
      {category.menu.sort((a, b) => a.displayFlags.menu.ordinal - b.displayFlags.menu.ordinal).map((product, k) => {
        const productClass = productEntrySelector(product.productId)!.product;
        return productClass &&
          <Box key={k} sx={{ pt: 4 }}>
            <ProductDisplay
              description
              allowAdornment
              dots
              displayContext="menu"
              price
              productMetadata={menu.product_instance_metadata[product.id]}
            />
            {product.displayFlags.menu.show_modifier_options && productClass.modifiers.length &&
              <WModifiersComponent product={productClass} />}
          </Box>
      })}
      {category.footer && (
        <small>
          <span dangerouslySetInnerHTML={{ __html: category.footer }} />
        </small>
      )}
    </Box>);
};

let WMenuRecursive: ({ menu, category }: WMenuDisplayProps) => JSX.Element;

function WMenuAccordion({ menu, category }: WMenuDisplayProps) {
  const [activePanel, setActivePanel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
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
    <Box>
      {category.menu.length > 0 && (
        <WMenuSection menu={menu} category={category} />
      )}
      {category.children.map((subSection, i) => {
        const subCategory = menu.categories[subSection];
        return (
          <Box sx={{ pt: 1 }} key={i}>
            <Accordion expanded={isExpanded && activePanel === i} onChange={(e, _) => toggleAccordion(e, i)}  >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant='h4' sx={{ ml: 2, py: 2 }} dangerouslySetInnerHTML={{ __html: subCategory.menu_name }} />
              </AccordionSummary>
              <AccordionDetails>
                <WMenuRecursive menu={menu} category={subCategory} />
              </AccordionDetails>
            </Accordion>
          </Box>);
      }
      )}
    </Box>);
}

function WMenuTabbed({ menu, category }: WMenuDisplayProps) {
  const [active, setActive] = useState<string>(category.children[0]);
  return (
    <Box>
      {category.menu.length > 0 && (
        <WMenuSection menu={menu} category={category} />
      )}
      <TabContext value={active}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList
            TabIndicatorProps={{ hidden: true }}
            scrollButtons={false}
            centered
            onChange={(_, v) => setActive(v)}
            aria-label={`${category.menu_name} tab navigation`}
          >
            {category.children.map((section, i) => (
              <Tab wrapped key={i} label={<Typography variant='h6'>{menu.categories[section].menu_name}</Typography>} value={section} />
            ))}
          </TabList>
        </Box>
        {category.children.map((subSection) => {
          const subCategory = menu.categories[subSection];
          return (
            <TabPanel sx={{ p: 0 }} key={subSection} value={subSection}>
              <WMenuRecursive menu={menu} category={subCategory} />
            </TabPanel>);
        }
        )}
      </TabContext>
    </Box>);
}

function WMenuFlat({ menu, category }: WMenuDisplayProps) {
  return (
    <Box>
      {category.children.map((subSection) => {
        const subCategory = menu.categories[subSection];
        return (
          <Box sx={{ pt: 4 }} key={subSection}>
            <Typography variant="h4" sx={{ ml: 2 }} dangerouslySetInnerHTML={{ __html: subCategory.menu_name }} />
            <Separator />
            <WMenuRecursive menu={menu} category={subCategory} />
          </Box>)
      })}
      <WMenuSection menu={menu} category={category} />
    </Box>);
}

WMenuRecursive = (props: WMenuDisplayProps) => {
  switch (props.category.nesting) {
    case CategoryDisplay.FLAT:
      return <WMenuFlat {...props} />;
    case CategoryDisplay.TAB:
      return props.category.children.length > 0 ? <WMenuTabbed {...props} /> : <WMenuFlat {...props} />;
    case CategoryDisplay.ACCORDION:
      return props.category.children.length > 0 ? <WMenuAccordion {...props} /> : <WMenuFlat {...props} />;
    case CategoryDisplay.TABLE:
      if (isNonProduction()) {
        // dev code
      }
      // expected catalog structure:
      // either 0 child categories and many contained products OR no contained products to many child categories
      // child categories have no child categories
      // metadata fields used to populate columns
      // description used to 
      return <WMenuDataGrid {...props} />;
  }
}

export function WMenuComponent() {
  const dispatch = useAppDispatch();
  const menu = useAppSelector(s => s.ws.menu);

  const [filteredMenu, setFilteredMenu] = useState<IMenu | null>(null);
  const FulfillmentId = useAppSelector(SelectDefaultFulfillmentId);
  // NOTE THIS WILL BE NULL UNTIL WE ASSIGN A FULFILLMENT
  const MENU_CATID = useAppSelector(SelectMenuCategoryId);
  const nextAvailableTime = useAppSelector(s => WDateUtils.ComputeServiceDateTime(...GetNextAvailableServiceDateTime(s)));

  useEffect(() => {
    dispatch(setService(FulfillmentId));
  }, [dispatch, FulfillmentId]);

  useEffect(() => {
    if (menu !== null && MENU_CATID) {
      const FilterProdsFxn = (item: IProductInstance) => FilterProduct(item, menu, (x) => x.menu.hide, nextAvailableTime, FulfillmentId);
      const menuCopy = cloneDeep(menu);
      FilterWMenu(menuCopy, FilterProdsFxn, nextAvailableTime, FulfillmentId);
      setFilteredMenu(menuCopy);
    }
  }, [menu, MENU_CATID]);
  if (filteredMenu === null) {
    return <LoadingScreen />;
  }
  if (!MENU_CATID || !Object.hasOwn(filteredMenu.categories, MENU_CATID)) {
    return <>We're misconfigured!</>
  }
  return (<WMenuRecursive menu={filteredMenu} category={filteredMenu.categories[MENU_CATID]} />);
}