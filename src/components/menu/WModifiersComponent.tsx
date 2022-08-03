import { Grid, Box } from "@mui/material";
import { IProduct, MenuModifiers } from "@wcp/wcpshared";
import { ProductPrice, ProductTitle, ProductDescription } from "../styled/styled";

export function WModifiersComponent({ product, menuModifiers }: { product: IProduct; menuModifiers: MenuModifiers }) {
  return (
    <>
      {product.modifiers.map((mod_def, i) =>
        <Grid container sx={{py:2}} key={i}>
          <Grid item xs={12} sx={{pb:1}}>
            <ProductTitle>
              {menuModifiers[mod_def.mtid].modifier_type.display_name ? menuModifiers[mod_def.mtid].modifier_type.display_name : menuModifiers[mod_def.mtid].modifier_type.name}
            </ProductTitle>
          </Grid>
          {menuModifiers[mod_def.mtid].options_list.map((opt, j) =>
            <Grid xs={12} md={6} lg={4} key={j} sx={{ pl: 3, pt: 1 }}>
              <Box sx={{ position: 'relative' }}>
                <ProductDescription>{opt.mo.item.display_name}</ProductDescription>
                <ProductPrice sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1}}>
                  {opt.mo.item.price.amount ? (opt.mo.item.price.amount / 100) : "No Charge"}
                </ProductPrice>
              </Box>
            </Grid>)}
        </Grid>)}
    </>
  )
};

