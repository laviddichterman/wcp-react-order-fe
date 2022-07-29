import { Typography, Grid } from '@mui/material';
import { WProductComponent } from '../WProductComponent';
import { IProductInstance } from '@wcp/wcpshared';
import { useAppSelector } from '../../app/useHooks';
import { SelectMainCategoryId, SelectMainProductCategoryCount } from '../../app/store';
import { WShopForProductsStageProps } from './WShopForProductsStageContainer';
import { ClickableProductDisplay, Separator, StageTitle } from '../styled/styled';

export function WShopForPrimaryProductsStage({ ProductsForCategoryFilteredAndSorted, onProductSelection }: WShopForProductsStageProps) {
  const MAIN_CATID = useAppSelector(SelectMainCategoryId);
  const numMainCategoryProducts = useAppSelector(SelectMainProductCategoryCount);
  const menu = useAppSelector(s => s.ws.menu!);

  return (
    <>
      <StageTitle>{numMainCategoryProducts > 0 ? "Click a pizza below or next to continue." : "Click a pizza below to get started."}</StageTitle>
      <Separator sx={{pb: 3}}/>
      <Grid container>
        {ProductsForCategoryFilteredAndSorted(MAIN_CATID).map((p: IProductInstance, i: number) =>
          <Grid item xs={12} md={6} lg={4} xl={3} key={i} >
            <ClickableProductDisplay sx={{ mb: 3.75, mx: 2 }} onClick={(e) => onProductSelection('topOfShop', MAIN_CATID, p.id)}>
              <WProductComponent productMetadata={menu.product_instance_metadata[p.id]} allowAdornment description dots price menuModifiers={menu.modifiers} displayContext="order" />
            </ClickableProductDisplay>
          </Grid>)}
      </Grid>
    </>
  );
}