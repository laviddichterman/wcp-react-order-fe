import { Typography, Grid } from '@mui/material';
import { WProductComponent } from '../WProductComponent';
import { IProductInstance } from '@wcp/wcpshared';
import { useAppSelector } from '../../app/useHooks';
import { SelectMainCategoryId, SelectMainProductCategoryCount } from '../../app/store';
import { WShopForProductsStageProps } from './WShopForProductsStageContainer';

export function WShopForPrimaryProductsStage({ ProductsForCategoryFilteredAndSorted, onProductSelection } : WShopForProductsStageProps) {
  const MAIN_CATID = useAppSelector(SelectMainCategoryId);
  const numMainCategoryProducts = useAppSelector(SelectMainProductCategoryCount);
  const menu = useAppSelector(s => s.ws.menu!);

  return (
        <>
          <Typography variant="h5" className="flush--top" sx={{  mt: 2, mb: 1, fontWeight: 'bold' }}>{numMainCategoryProducts > 0 ? "Click a pizza below or next to continue." : "Click a pizza below to get started"}</Typography>
          <div className="ordering-menu menu-list menu-list__dotted">
            <Grid container className="flexitems menu-list__items">
              {ProductsForCategoryFilteredAndSorted(MAIN_CATID).map((p: IProductInstance, i: number) =>
                <Grid item xs={12} sm={6} md={4} lg={3} key={i} className="flexitem menu-list__item">
                  <div className="offer-link" onClick={(e) => onProductSelection('topOfShop', MAIN_CATID, p.id)}>
                    <WProductComponent productMetadata={menu.product_instance_metadata[p.id]} allowAdornment description dots price menuModifiers={menu.modifiers} displayContext="order" />
                  </div>
                </Grid>)}
            </Grid>
          </div>
        </>
  );
}