import PropTypes, { InferProps } from "prop-types";

export function WModifiersComponent({product, menu}: InferProps<typeof WModifiersComponent.propTypes>) {
  return (
  <>
  { product.PRODUCT_CLASS.modifiers.map((mod_def : any, i : number) => 
    <li className="menu-list__item modifier-section" key={i}>
      <h4 className="menu-list__item-title">
        {menu.modifiers[mod_def.mtid].modifier_type.display_name ? menu.modifiers[mod_def.mtid].modifier_type.display_name : menu.modifiers[mod_def.mtid].modifier_type.name}
      </h4>
      <div className="menu-list">
        <ul className="flexitems menu-list__items">
          { menu.modifiers[mod_def.mtid].options_list.map((opt : any, j: number) => 
          <li key={j} className="flexitem menu-list__item">
            <p className="menu-list__item-desc">
              <span className="desc__content">{opt.name}</span>
              <span className="menu-list__item-price">{opt.price ? opt.price : "No Charge"}</span>
            </p>
          </li>) }
        </ul>
      </div>
    </li> )}
  </>
  )
  };

WModifiersComponent.propTypes = {
  product: PropTypes.any.isRequired, 
  menu:PropTypes.any.isRequired
};

