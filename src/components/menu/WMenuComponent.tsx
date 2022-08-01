import React, { useState, useEffect } from 'react';
import { WProductComponent } from '../WProductComponent';
import { WModifiersComponent } from './WModifiersComponent';
import { useAppSelector } from "../../app/useHooks";
import { Box, Tab, Typography } from '@mui/material';
import { TabList, TabPanel, TabContext } from '@mui/lab'
import { IMenu, CategoryEntry, IProductInstance, FilterProduct, FilterWMenu } from '@wcp/wcpshared';
import { GetNextAvailableServiceDateTime, IProductsSelectors, SelectMenuCategoryId } from '../../app/store';
import LoadingScreen from '../LoadingScreen';
import { Separator } from '../styled/styled';


function WMenuSection({ menu, section }: { menu: IMenu; section: CategoryEntry; }) {
  const productClassSelector = useAppSelector(s => (id: string) => IProductsSelectors.selectById(s, id));
  return (
    <>
      {section.menu.sort((a, b) => a.display_flags.menu.ordinal - b.display_flags.menu.ordinal).map((product, k) => {
        const productClass = productClassSelector(product.product_id);
        return productClass &&
          <React.Fragment key={k}>
            <WProductComponent description allowAdornment dots={false} menuModifiers={menu.modifiers} displayContext="menu" price productMetadata={menu.product_instance_metadata[product.id]} />
            {product.display_flags.menu.show_modifier_options && productClass.modifiers.length ? <WModifiersComponent product={productClass} menuModifiers={menu.modifiers} /> : ""}
          </React.Fragment>
      })}
      {section.footer && (
        <small>
          <span dangerouslySetInnerHTML={{ __html: section.footer }} />
        </small>
      )}
    </>);
};

export function WMenuComponent() {
  const menu = useAppSelector(s => s.ws.menu);
  const [filteredMenu, setFilteredMenu] = useState<IMenu | null>(null);
  const MENU_CATID = useAppSelector(SelectMenuCategoryId);
  const currentTime = useAppSelector(s => s.metrics.currentTime);
  const nextAvailableTime = useAppSelector(s => GetNextAvailableServiceDateTime(s, currentTime));
  const [displayMenu, setDisplayMenu] = useState<string[]>([]);
  useEffect(() => {
    if (menu !== null && MENU_CATID) {
      const FilterProdsFxn = (item: IProductInstance) => FilterProduct(item, menu, (x) => x.menu.hide, nextAvailableTime);
      const menuCopy = structuredClone(menu);
      FilterWMenu(menuCopy, FilterProdsFxn, nextAvailableTime);
      setFilteredMenu(menuCopy);
      const MENU_CATEGORIES = menuCopy.categories[MENU_CATID].children;
      // e.g.: [FOOD: [SMALL PLATES, PIZZAS], COCKTAILS: [], WINE: [BUBBLES, WHITE, RED, PINK]]
      // create a menu from the filtered categories and products.
      const is_tabbed_menu = MENU_CATEGORIES.reduce((acc, child_id) => acc || menuCopy.categories[child_id].children.length > 0, false);
      setDisplayMenu(is_tabbed_menu ? MENU_CATEGORIES : [MENU_CATID as string]);
    }
  }, [menu, nextAvailableTime, MENU_CATID]);
  const [active, setActive] = useState(0);
  if (!MENU_CATID) {
    return <>We're misconfigured!</>
  }
  if (filteredMenu === null) {
    return <LoadingScreen />;
  }
  return (
    <Box className="wmenu">
      <TabContext value={String(active)}>
        {displayMenu.length > 1 && (
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList centered selectionFollowsFocus onChange={(_, v) => setActive(v)} aria-label="Menu tab navigation">
              {displayMenu.map((section, i) => (
                <Tab key={i} label={<Typography variant='h6'>{filteredMenu.categories[section].menu_name}</Typography>} value={String(i)} />
              ))}
            </TabList>
          </Box>
        )}
        {displayMenu.map((section, i) => {
          const category = filteredMenu.categories[section];
          return (
            <TabPanel key={i} value={`${i}`}>
              {category.children.map((subsection: any, j: number) => {
                const subCategory = filteredMenu.categories[subsection];
                return (<div key={j}>
                  <Typography variant="h2" dangerouslySetInnerHTML={{ __html: subCategory.menu_name }} />
                  {subCategory.subtitle !== null &&
                    <Typography variant="h4" dangerouslySetInnerHTML={{ __html: subCategory.subtitle }} />
                  }
                  <Separator />
                  <WMenuSection menu={filteredMenu} section={subCategory} />
                </div>)
              })}

              {category.menu.length && (
                <div>
                  {category.subtitle && (
                    <Typography variant="h3" dangerouslySetInnerHTML={{ __html: category.subtitle }} />
                  )}
                  <WMenuSection menu={filteredMenu} section={category} />
                </div>
              )}
            </TabPanel>
          )
        })}
      </TabContext>
    </Box>);
}