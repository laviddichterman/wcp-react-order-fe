import React, { useState, useEffect, useMemo } from 'react';
import { ProductDisplay } from '../WProductComponent';
import { WModifiersComponent } from './WModifiersComponent';
import { useAppSelector } from "../../app/useHooks";
import { Box, Tab, Typography, useMediaQuery, useTheme } from '@mui/material';
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
          <Box key={k} sx={{ pt: 2 }}>
            <ProductDisplay
              description
              allowAdornment
              dots
              menuModifiers={menu.modifiers}
              displayContext="menu"
              price
              productMetadata={menu.product_instance_metadata[product.id]}
            />
            {product.display_flags.menu.show_modifier_options && productClass.modifiers.length &&
              <WModifiersComponent product={productClass} menuModifiers={menu.modifiers} />}
          </Box>
      })}
      {section.footer && (
        <small>
          <span dangerouslySetInnerHTML={{ __html: section.footer }} />
        </small>
      )}
    </>);
};

function WTabbedMenu({ menu, category }: { menu: IMenu; category: CategoryEntry; }) {
  const [displayMenu, setDisplayMenu] = useState<string[]>(category.children);
  const theme = useTheme();
  const forceScrollable = useMediaQuery(theme.breakpoints.between('xs', 'md'));
  const [active, setActive] = useState<string>(category.children[0]);
  const hasNestedChildrenCategories = useMemo(() => {
    return category.children.reduce((acc, subsection) => acc || menu.categories[subsection].children.length > 0, false);
  }, [menu, category]);
  return (
    <Box>

      {hasNestedChildrenCategories ? (
        <TabContext value={active}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList TabIndicatorProps={{hidden: true}} scrollButtons={false} centered onChange={(_, v) => setActive(v)} aria-label={`${category.menu_name} tab navigation`}>
              {displayMenu.map((section, i) => (
                <Tab wrapped key={i} label={<Typography variant='h6'>{menu.categories[section].menu_name}</Typography>} value={section} />
              ))}
            </TabList>
          </Box>
          {displayMenu.map((subSection) => {
            const subCategory = menu.categories[subSection];
            console.log(subCategory)
            return (
              <TabPanel sx={{px:0}} key={subSection} value={subSection}>
                <WTabbedMenu menu={menu} category={subCategory} />
              </TabPanel>);
          }
          )}
        </TabContext>) :
        (category.children.map((subSection) => {
          const subCategory = menu.categories[subSection];
          return (
            <div key={subSection}>
              <Typography variant="h4" dangerouslySetInnerHTML={{ __html: subCategory.menu_name }} />
              {subCategory.subtitle !== null &&
                <Typography variant="h6" dangerouslySetInnerHTML={{ __html: subCategory.subtitle }} />
              }
              <Separator />
              <WMenuSection menu={menu} section={subCategory} />
            </div>)
        }))}

      {category.menu.length > 0 && (
        <div>
          {category.subtitle && (
            <Typography variant="subtitle1" dangerouslySetInnerHTML={{ __html: category.subtitle }} />
          )}
          <WMenuSection menu={menu} section={category} />
        </div>
      )}
    </Box>);
}

export function WMenuComponent() {

  const menu = useAppSelector(s => s.ws.menu);
  const [filteredMenu, setFilteredMenu] = useState<IMenu | null>(null);
  const MENU_CATID = useAppSelector(SelectMenuCategoryId);
  const currentTime = useAppSelector(s => s.metrics.currentTime);
  const nextAvailableTime = useAppSelector(s => GetNextAvailableServiceDateTime(s, currentTime));
  useEffect(() => {
    if (menu !== null && MENU_CATID) {
      const FilterProdsFxn = (item: IProductInstance) => FilterProduct(item, menu, (x) => x.menu.hide, nextAvailableTime);
      const menuCopy = structuredClone(menu);
      FilterWMenu(menuCopy, FilterProdsFxn, nextAvailableTime);
      setFilteredMenu(menuCopy);
      // const MENU_CATEGORIES = menuCopy.categories[MENU_CATID].children;
      // e.g.: [FOOD: [SMALL PLATES, PIZZAS], COCKTAILS: [], WINE: [BUBBLES, WHITE, RED, PINK]]
      // create a menu from the filtered categories and products.
      // const newDisplayMenu = is_tabbed_menu ? MENU_CATEGORIES : [MENU_CATID];
      // if (newDisplayMenu.length > 0 && (!active || displayMenu.indexOf(active) === -1)) {
      //   console.log(`active was ${active} is going to be set to ${newDisplayMenu[0]}`)
      //   setActive(newDisplayMenu[0]);
      // }
      // setDisplayMenu(newDisplayMenu);

    }
  }, [menu, nextAvailableTime, MENU_CATID]);
  if (filteredMenu === null) {
    return <LoadingScreen />;
  }
  if (!MENU_CATID || !Object.hasOwn(filteredMenu.categories, MENU_CATID)) {
    return <>We're misconfigured!</>
  }
  return (<WTabbedMenu menu={filteredMenu} category={filteredMenu.categories[MENU_CATID]} />);
}