import React, { useState } from 'react';

import { WProductComponent } from '../WProductComponent';
import { WModifiersComponent } from '../WModifiersComponent';
import { IMenu, CategoryEntry } from '@wcp/wcpshared';


function WMenuSection({ menu, section } : { menu: IMenu; section: CategoryEntry;}) {
  return (
    <>
      <ul className="menu-list__items">
        {section.menu.sort((a: any, b: any) => a.display_flags.menu.ordinal - b.display_flags.menu.ordinal).map((product: any, k: number) => (
          <React.Fragment key={k}>
            <li className="menu-list__item">
              <WProductComponent product={product} description allowAdornment dots menu={menu} displayContext="menu" price />
            </li>
            {product.display_flags.menu.show_modifier_options && product.PRODUCT_CLASS.modifiers.length ? <WModifiersComponent product={product} menu={menu} /> : ""}
          </React.Fragment>
        ))}
      </ul>
      {section.footer ? (
        <small>
          <span dangerouslySetInnerHTML={{ __html: section.footer }} />
        </small>
      ) : ""}
    </>);
};

export function WMenuComponent({ menu, displayMenu }: {menu: IMenu; displayMenu: string[];}) {
  const [active, setActive] = useState(0);
  return (
    <article className="article--page article--main border-simple post-69 page type-page status-publish has-post-thumbnail hentry">
      <section className="article__content">
        <div className="container">
          <section className="page__content js-post-gallery cf">
            <div className="wmenu">
              <div className="tabs">
                {displayMenu.length > 1 ? (
                  <ul className="tabs__nav nav nav-tabs">
                    {displayMenu.map((section, i) => (
                      <li key={i}>
                        <button onClick={() => setActive(i)} className={i === active ? "current" : ""}>{menu.categories[section].menu_name}</button>
                      </li>
                    ))}
                  </ul>
                ) : ""}
                {active < displayMenu.length ? (
                  <div>
                    {menu.categories[displayMenu[active]].children.map((subsection: any, j: number) =>
                      <div key={j}>
                        <h2 className="menu-list__title">
                          <span dangerouslySetInnerHTML={{ __html: menu.categories[subsection].menu_name }} />
                        </h2>
                        <div className="menu-list menu-list__dotted">
                          {menu.categories[subsection].subtitle ? (
                            <h4 className="subtitle flush--top">
                              <span dangerouslySetInnerHTML={{ __html: menu.categories[subsection].subtitle }} />
                            </h4>) : ""}
                          <hr className="separator" />
                          <WMenuSection menu={menu} section={menu.categories[subsection]} />
                        </div>
                      </div>
                    )}

                    {menu.categories[displayMenu[active]].menu.length ? (
                      <div className="menu-list menu-list__dotted">
                        {menu.categories[displayMenu[active]].subtitle ? (
                          <h3 className="subtitle flush--top">
                            <strong><span dangerouslySetInnerHTML={{ __html: menu.categories[displayMenu[active]].subtitle }} /></strong>
                          </h3>
                        ) : ""}
                        <WMenuSection menu={menu} section={menu.categories[displayMenu[active]]} />
                      </div>
                    ) : ""}

                  </div>
                ) : ""}

              </div>
            </div>
          </section>
        </div>
      </section>
    </article>);
}