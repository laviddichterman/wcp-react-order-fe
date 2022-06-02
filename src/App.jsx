import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { WMenuComponent } from './components/menu/WMenuComponent';
import { MENU_CATID } from './config';
import useSocketio from './hooks/useSocketIo';
const wcpshared = require('@wcp/wcpshared');

const FilterProduct = wcpshared.FilterProduct;
const FilterWMenu = wcpshared.FilterWMenu;

const App = () => {
  const { catalog } = useSocketio();
  const [menu, setMenu] = useState(null);
  const [displayMenu, setDisplayMenu] = useState([MENU_CATID]);

  useEffect(() => {
    if (catalog) {
      const WMENU = new wcpshared.WMenu(catalog);
      const current_time = moment();
      const FilterProdsFxn = (item) => FilterProduct(item, WMENU, (x) => x.menu.hide, current_time);
      FilterWMenu(WMENU, FilterProdsFxn, current_time);
      setMenu(WMENU);
      const MENU_CATEGORIES = WMENU.categories[MENU_CATID].children;
      // e.g.: [FOOD: [SMALL PLATES, PIZZAS], COCKTAILS: [], WINE: [BUBBLES, WHITE, RED, PINK]]
      // create a menu from the filtered categories and products.
      const is_tabbed_menu = MENU_CATEGORIES.reduce((acc, child_id) => acc || WMENU.categories[child_id].children.length > 0, false);
      setDisplayMenu(is_tabbed_menu ? MENU_CATEGORIES : [MENU_CATID]);
    }
  }, [catalog]);
  if (!menu) {
    return <div>Loading...</div>
  }
  return (
    <article className="article--page article--main border-simple post-69 page type-page status-publish has-post-thumbnail hentry">
      <section className="article__content">
        <div className="container">
          <section className="page__content js-post-gallery cf">
            <WMenuComponent menu={menu} catalog={catalog} displayMenu={displayMenu} />
          </section>
        </div>
      </section>
    </article>
  );
};

export default App;
