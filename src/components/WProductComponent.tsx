import { useMemo } from 'react';
import PropTypes, { InferProps } from "prop-types";
const wcpshared = require('@wcp/wcpshared');

const ComputePotentialPrices = wcpshared.ComputePotentialPrices;

export function WProductComponent({ product, description, allowadornment, dots, menu, displayContext, price }: InferProps<typeof WProductComponent.propTypes>) {
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
          return prices.length > 1 && prices[0] !== prices[prices.length - 1] ? `from ${prices[0]} to ${prices[prices.length - 1]}` : `${prices[0]}`;
        }
        case "LIST": return ComputePotentialPrices(product, menu).join("/");
        case "ALWAYS": default: return `${product.price}`;
      }
    }
    return `${product.price}`;
  }, [product, displayContext, menu]);
  return (
    <div className={adornmentHTML ? "menu-list__item-highlight-wrapper" : ""} >
      {adornmentHTML ? <span className="menu-list__item-highlight-title" dangerouslySetInnerHTML={{ __html: adornmentHTML }} /> : ""}
      <h4 className="menu-list__item-title">
        <span className="item_title">{product.processed_name}</span>
        {dots ? <span className="dots" /> : ""}
      </h4>
      {descriptionHTML ? <p className="menu-list__item-desc">
        <span className="desc__content">
          <span dangerouslySetInnerHTML={{ __html: descriptionHTML }} />
        </span>
      </p> : ""}
      {description && showOptionsSections ? product.options_sections.map((option_section: any, l: number) =>
        <p key={l} className="menu-list__item-desc">
          <span className="desc__content">
            {product.is_split ? <span ><strong>{option_section[0]}: </strong></span> : ""}
            <span>{option_section[1]}</span>
          </span>
        </p>) : ""}
      {dots ? <span className="dots" /> : ""}
      {price ? <span className="menu-list__item-price">{priceText}</span> : ""}
    </div>)
};

WProductComponent.propTypes = {
  product: PropTypes.any.isRequired,
  description: PropTypes.bool.isRequired,
  allowadornment: PropTypes.bool.isRequired,
  dots: PropTypes.bool.isRequired,
  menu: PropTypes.any.isRequired,
  displayContext: PropTypes.string.isRequired,
  price: PropTypes.bool.isRequired
};

