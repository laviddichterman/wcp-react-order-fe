import { useMemo } from 'react';
import { ComputePotentialPrices, WProductMetadata, WProductDisplayOptions, MenuModifiers, PriceDisplay } from '@wcp/wcpshared';
import { IProductInstancesSelectors } from '../app/store';
import { useAppSelector } from '../app/useHooks';
import { Box, BoxProps } from '@mui/material';
interface WProductComponentProps { 
  productMetadata: WProductMetadata;
  description: boolean;
  allowAdornment: boolean;
  dots: boolean;
  menuModifiers: MenuModifiers;
  displayContext: "order" | "menu";
  price: boolean;
};

export function WProductComponent({ productMetadata, description, allowAdornment, dots, menuModifiers, displayContext, price, ...other }: WProductComponentProps & BoxProps) {
  const productInstance = useAppSelector(s => IProductInstancesSelectors.selectById(s, productMetadata.pi[0]));
  const adornmentHTML = useMemo(() => allowAdornment && productInstance && productInstance.display_flags[displayContext].adornment ? productInstance.display_flags[displayContext].adornment : "", [allowAdornment, productInstance, displayContext]);
  const descriptionHTML = useMemo(() => description && productMetadata.description ? productMetadata.description : "", [description, productMetadata.description]);
  const optionsSections = useMemo(() => {
    if (!description || !productInstance || productInstance.display_flags[displayContext].suppress_exhaustive_modifier_list) {
      return [[]];
    }
    const options = WProductDisplayOptions(menuModifiers, productMetadata.exhaustive_modifiers);
    return !(options.length === 1 && options[0][1] === productMetadata.name) ? options : [[]];
  }, [description, displayContext, menuModifiers, productInstance, productMetadata.exhaustive_modifiers, productMetadata.name]);
  const priceText = useMemo(() => {
    if (productInstance && productMetadata.incomplete) {
      switch (productInstance.display_flags[displayContext].price_display) {
        case PriceDisplay.FROM_X: return `from ${productMetadata.price}`;
        case PriceDisplay.VARIES: return "MP";
        case PriceDisplay.MIN_TO_MAX: {
          const prices = ComputePotentialPrices(productMetadata, menuModifiers);
          return prices.length > 1 && prices[0] !== prices[prices.length - 1] ? `from ${prices[0]} to ${prices[prices.length - 1]}` : `${prices[0]}`;
        }
        case PriceDisplay.LIST: return ComputePotentialPrices(productMetadata, menuModifiers).join("/");
        case PriceDisplay.ALWAYS: default: return `${productMetadata.price}`;
      }
    }
    return `${productMetadata.price}`;
  }, [productInstance, productMetadata, displayContext, menuModifiers]);
  return (
    <Box {...other} className={adornmentHTML ? "menu-list__item-highlight-wrapper" : ""} >
      {adornmentHTML ? <span className="menu-list__item-highlight-title" dangerouslySetInnerHTML={{ __html: adornmentHTML }} /> : ""}
      <h4 className="menu-list__item-title">
        <span className="item_title">{productMetadata.name}</span>
        {dots ? <span className="dots" /> : ""}
      </h4>
      {descriptionHTML ? <p className="menu-list__item-desc">
        <span className="desc__content">
          <span dangerouslySetInnerHTML={{ __html: descriptionHTML }} />
        </span>
      </p> : ""}
      {description && optionsSections ? optionsSections.map((option_section, l) =>
        <p key={l} className="menu-list__item-desc">
          <span className="desc__content">
            {productMetadata.is_split ? <span ><strong>{option_section[0]}: </strong></span> : ""}
            <span>{option_section[1]}</span>
          </span>
        </p>) : ""}
      {dots ? <span className="dots" /> : ""}
      {price ? <span className="menu-list__item-price">{priceText}</span> : ""}
    </Box>)
};



