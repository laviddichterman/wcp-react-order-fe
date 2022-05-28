import React, { useEffect, useState, useMemo } from 'react';
import { MENU_CATID } from './config';
import useSocketio from './hooks/useSocketIo';
import moment from 'moment';
const wcpshared = require('@wcp/wcpshared'); 

const ComputePotentialPrices = wcpshared.ComputePotentialPrices;
const FilterProduct = wcpshared.FilterProduct;
const FilterWMenu = wcpshared.FilterWMenu;

const WProductComponent = ({product, description, allowadornment, dots, menu, displayContext, price}) => { 
  const adornmentHTML = useMemo(() => allowadornment && product.display_flags[displayContext].adornment ? product.display_flags[displayContext].adornment : "", [allowadornment, product, displayContext]); 
  const descriptionHTML = useMemo(() => description && product.processed_description ? product.processed_description : "", [description, product]);
  const showOptionsSections = useMemo(() => !product.display_flags[displayContext].suppress_exhaustive_modifier_list && !(product.options_sections.length === 1 && product.options_sections[0][1] === product.processed_name), [product, displayContext]);
  const priceText = useMemo(() => {
    if (product.incomplete) {
      switch (product.display_flags[displayContext].price_display) {
        case "FROM_X": return `from ${product.price}`;
        case "VARIES": return "MP";
        case "MIN_TO_MAX": {
          const prices = ComputePotentialPrices(product, menu); 
          return prices.length > 1 && prices[0] !== prices[prices.length-1] ? `from ${prices[0]} to ${prices[prices.length-1]}` : `${prices[0]}`;
        }
        case "LIST": return ComputePotentialPrices(product, this.menu).join("/");
        case "ALWAYS": default: return `${product.price}`;
      }
    }
    return `${product.price}`;
  }, [product, displayContext, menu]);
  return (
    <div className={adornmentHTML ? "menu-list__item-highlight-wrapper" : "" } >
      {adornmentHTML ? <span className="menu-list__item-highlight-title" dangerouslySetInnerHTML={{__html: adornmentHTML}} /> : "" }
      <h4 className="menu-list__item-title">
        <span className="item_title">{product.processed_name}</span>
        { dots ? <span className="dots" /> : "" }
      </h4>
      { descriptionHTML ? <p className="menu-list__item-desc">
        <span className="desc__content">
          <span dangerouslySetInnerHTML={{__html: descriptionHTML}} />
        </span>
      </p> : "" }
      { description && showOptionsSections ? product.options_sections.map((option_section, l) => 
        <p key={l} ng-repeat="option_section in ctrl.prod.options_sections" className="menu-list__item-desc">
          <span className="desc__content">
            { product.is_split ? <span ><strong>{option_section[0]}: </strong></span> : "" }
            <span>{option_section[1]}</span>
          </span>
        </p>) : "" }
        { dots ? <span className="dots" /> : "" }
        { price ? <span className="menu-list__item-price">{priceText}</span> : "" }
    </div>)
};

const WModifiersComponent = ({product, menu}) => (<>
  { product.PRODUCT_CLASS.modifiers.map((mod_def, i) => 
    <li className="menu-list__item modifier-section" key={i}>
      <h4 className="menu-list__item-title">
        {menu.modifiers[mod_def.mtid].modifier_type.display_name ? menu.modifiers[mod_def.mtid].modifier_type.display_name : menu.modifiers[mod_def.mtid].modifier_type.name}
      </h4>
      <div className="menu-list">
        <ul className="flexitems menu-list__items">
          { menu.modifiers[mod_def.mtid].options_list.map((opt, j) => 
          <li key={j} className="flexitem menu-list__item">
            <p className="menu-list__item-desc">
              <span className="desc__content">{opt.name}</span>
              <span className="menu-list__item-price">{opt.price ? opt.price : "No Charge"}</span>
            </p>
          </li>) }
        </ul>
      </div>
    </li> )}
  </>);

const WMenuSection = ({menu, section}) => (
  <ul className="menu-list__items">
    { section.sort((a, b)=>a.display_flags.menu.ordinal - b.display_flags.menu.ordinal).map((product, k) => (
      <React.Fragment key={k}>
        <li className="menu-list__item">
          <WProductComponent product={product} description allowadornment dots menu={menu} displayContext="menu" price />
        </li>
        { product.display_flags.menu.show_modifier_options && product.PRODUCT_CLASS.modifiers.length ? <WModifiersComponent product={product} menu={menu} /> : "" }
      </React.Fragment>
    ))}
  </ul>
);

const App = () => {
  const { catalog } = useSocketio();
  const [ menu, setMenu ] = useState(null);
  const [ displayMenu, setDisplayMenu] = useState([MENU_CATID]);
  const [ active, setActive ] = useState(0);

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
            <div className="wmenu">
              <div className="tabs">
                { displayMenu.length > 1 ? (
                <ul className="tabs__nav nav nav-tabs">
                  { displayMenu.map((section, i) => (
                    <li key={i}>
                      <button onClick={() => setActive(i)} className={i === active ? "current" : ""}>{menu.categories[section].menu_name}</button>
                    </li>
                  )) }
                </ul>
                ) : "" }
                { active < displayMenu.length ? (
                <div>
                  { menu.categories[displayMenu[active]].children.map((subsection, j) =>
                    <div key={j}>
                      <h2 className="menu-list__title">
                        <span dangerouslySetInnerHTML={{__html: menu.categories[subsection].menu_name}} />
                      </h2>
                      <div className="menu-list menu-list__dotted">
                        { menu.categories[subsection].subtitle ? (
                        <h4 className="subtitle flush--top">
                          <span dangerouslySetInnerHTML={{__html: menu.categories[subsection].subtitle}} />
                        </h4>) : "" }
                        <hr className="separator" />
                        <WMenuSection menu={menu} section={menu.categories[subsection].menu} />
                      </div>
                    </div>
                  ) } 
                  
                { menu.categories[displayMenu[active]].menu.length ? (
                  <div className="menu-list menu-list__dotted">
                    { menu.categories[displayMenu[active]].subtitle ? (
                      <h3 className="subtitle flush--top">
                        <strong><span dangerouslySetInnerHTML={{__html: menu.categories[displayMenu[active]].subtitle}} /></strong>
                      </h3>
                    ) : "" } 
                    <WMenuSection menu={menu} section={menu.categories[displayMenu[active]].menu} />
                  </div>
                ) : "" }
                
              </div>
                ) : "" }

              </div>
            </div>
          </section>
        </div>
      </section>
    </article>
  );
};

export default App;
