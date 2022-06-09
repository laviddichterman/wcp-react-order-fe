import React, { useEffect, useState } from 'react';
import { WMenuComponent } from './components/menu/WMenuComponent';
import { MENU_CATID } from './config';
import useSocketio from './app/useSocketIo';
import {FilterProduct, FilterWMenu, GenerateMenu, ICatalog, IMenu, IProductInstance} from '@wcp/wcpshared';


const App = () => {
  const { catalog } = useSocketio();
  const [menu, setMenu] = useState<IMenu | null>(null);
  const [displayMenu, setDisplayMenu] = useState<string[]>([]);

  useEffect(() => {
    if (catalog) {
      const MENU = GenerateMenu(catalog as unknown as ICatalog);
      const current_time = new Date();
      const FilterProdsFxn = (item : IProductInstance) => FilterProduct(item, MENU, (x) => x.menu.hide, current_time);
      FilterWMenu(MENU, FilterProdsFxn, current_time);
      setMenu(MENU);
      const MENU_CATEGORIES = MENU.categories[MENU_CATID as string].children;
      // e.g.: [FOOD: [SMALL PLATES, PIZZAS], COCKTAILS: [], WINE: [BUBBLES, WHITE, RED, PINK]]
      // create a menu from the filtered categories and products.
      const is_tabbed_menu = MENU_CATEGORIES.reduce((acc, child_id) => acc || MENU.categories[child_id].children.length > 0, false);
      setDisplayMenu(is_tabbed_menu ? MENU_CATEGORIES : [MENU_CATID as string]);
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
