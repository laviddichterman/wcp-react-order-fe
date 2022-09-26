import { Grid } from '@mui/material';
import { ClickableProductDisplay } from '../WProductComponent';
import { IProductInstance } from '@wcp/wcpshared';
import { useAppSelector } from '../../app/useHooks';
import { SelectMainCategoryId, SelectMainProductCategoryCount } from '../../app/store';
import { WShopForProductsStageProps } from './WShopForProductsStageContainer';
import { Separator, StageTitle } from '@wcp/wario-ux-shared';

export function WShopForPrimaryProductsStage({ ProductsForCategoryFilteredAndSorted, onProductSelection, hidden }: WShopForProductsStageProps) {
  const MAIN_CATID = useAppSelector(SelectMainCategoryId)!;
  const numMainCategoryProducts = useAppSelector(SelectMainProductCategoryCount);
  const menu = useAppSelector(s => s.ws.menu!);

  return (
    <div hidden={hidden}>
      <StageTitle>{numMainCategoryProducts > 0 ? "Click a pizza below or next to continue." : "Click a pizza below to get started."}</StageTitle>
      <Separator sx={{ pb: 3 }} />
      <Grid container>
        {ProductsForCategoryFilteredAndSorted(MAIN_CATID).map((p: IProductInstance, i: number) =>
          <Grid item xs={12} md={6} lg={4} xl={3} key={i} >
            <ClickableProductDisplay
              sx={{ mb: 3.75, mx: 2 }}
              onClick={(e) => onProductSelection('WARIO_order', MAIN_CATID, p.id)}
              productMetadata={menu.product_instance_metadata[p.id]}
              allowAdornment
              description
              dots
              price
              displayContext="order"
            />
          </Grid>)}
      </Grid>
    </div>
  );
}