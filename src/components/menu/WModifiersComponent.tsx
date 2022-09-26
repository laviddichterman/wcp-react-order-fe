import { Grid, Box } from "@mui/material";
import { ProductPrice, ProductTitle, ProductDescription, getModifierOptionById, getModifierTypeEntryById } from "@wcp/wario-ux-shared";
import { IProduct, MoneyToDisplayString } from "@wcp/wcpshared";
import { useAppSelector } from "../../app/useHooks";

export function WModifiersComponent({ product }: { product: IProduct; }) {
  const modifierTypeEntrySelector = useAppSelector(s => (id: string) => getModifierTypeEntryById(s.ws.modifierEntries, id));
  const modifierOptionSelector = useAppSelector(s => (id: string) => getModifierOptionById(s.ws.modifierOptions, id));
  return (
    <>
      {product.modifiers.map((mod_def, i) => {
        const modifierTypeEntry = modifierTypeEntrySelector(mod_def.mtid)!;
        return (<Grid container sx={{ py: 2 }} key={i}>
          <Grid item xs={12} sx={{ pb: 1 }}>
            <ProductTitle>
              {modifierTypeEntry.modifierType.displayName ? modifierTypeEntry.modifierType.displayName : modifierTypeEntry.modifierType.name}
            </ProductTitle>
          </Grid>
          {modifierTypeEntry.options.map((opt, j) => {
            const modifierOption = modifierOptionSelector(opt)!;
            return (<Grid item xs={12} md={6} lg={4} key={j} sx={{ pl: 3, pt: 1 }}>
              <Box sx={{ position: 'relative' }}>
                <ProductDescription>{modifierOption.displayName}</ProductDescription>
                <ProductPrice sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
                  {modifierOption.price.amount !== 0 ? MoneyToDisplayString(modifierOption.price, false) : "No Charge"}
                </ProductPrice>
              </Box>
            </Grid>)
          })}
        </Grid>)
      })}
    </>
  )
};

