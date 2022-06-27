import { IProduct, MenuModifiers } from "@wcp/wcpshared";

export function WModifiersComponent({product, menuModifiers}: { product: IProduct; menuModifiers: MenuModifiers}) {
  return (
  <>
  { product.modifiers.map((mod_def, i) => 
    <li className="menu-list__item modifier-section" key={i}>
      <h4 className="menu-list__item-title">
        {menuModifiers[mod_def.mtid].modifier_type.display_name ? menuModifiers[mod_def.mtid].modifier_type.display_name : menuModifiers[mod_def.mtid].modifier_type.name}
      </h4>
      <div className="menu-list">
        <ul className="flexitems menu-list__items">
          { menuModifiers[mod_def.mtid].options_list.map((opt, j) => 
          <li key={j} className="flexitem menu-list__item">
            <p className="menu-list__item-desc">
              <span className="desc__content">{opt.mo.item.display_name}</span>
              <span className="menu-list__item-price">{opt.mo.item.price.amount ? (opt.mo.item.price.amount / 100) : "No Charge"}</span>
            </p>
          </li>) }
        </ul>
      </div>
    </li> )}
  </>
  )
  };

