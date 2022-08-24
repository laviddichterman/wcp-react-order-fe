import { ProductDisplay } from './WProductComponent';
import { removeFromCart, updateCartQuantity } from '../app/slices/WCartSlice';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { useCallback } from 'react';
import { IMenu, CartEntry } from '@wcp/wcpshared';
import { IconButton, Grid, TableContainer, Table, TableCell, TableHead, TableBody, Typography, Paper, TableRow } from '@mui/material';
import { Clear, Edit } from '@mui/icons-material';
import { GetSelectableModifiersForCartEntry, selectGroupedAndOrderedCart } from '../app/store';
import { CheckedNumericInput } from './CheckedNumericTextInput';
import { styled } from '@mui/system';


const RemoveFromCart = styled(Clear)(() => ({
  border: '1px solid',
  borderRadius: 16,
  padding: 4
}))

interface IOrderCart {
  isProductEditDialogOpen: boolean;
  setProductToEdit: (entry: CartEntry) => void;
}

export function WOrderCart({ isProductEditDialogOpen, setProductToEdit }: IOrderCart) {
  const dispatch = useAppDispatch();
  const menu = useAppSelector(s => s.ws.menu!);
  const cart = useAppSelector(selectGroupedAndOrderedCart);
  const selectSelectableModifiersForEntry = useAppSelector(s => (id: string, menu: IMenu) => GetSelectableModifiersForCartEntry(s, id, menu));
  const productHasSelectableModifiers = useCallback((id: string, menu: IMenu) => Object.values(selectSelectableModifiersForEntry(id, menu)).length > 0, [selectSelectableModifiersForEntry]);
  const setRemoveEntry = (id: string) => {
    dispatch(removeFromCart(id));
  };
  const setEntryQuantity = (id: string, quantity: number | null) => {
    if (quantity !== null) {
      dispatch(updateCartQuantity({ id, newQuantity: quantity }));
    }
  };
  return cart.length === 0 ? <></> :
    <div id="orderCart">
      <Typography variant="h4" sx={{ p: 2, textTransform: 'uppercase', fontFamily: 'Source Sans Pro', }}>Current Order</Typography>
      <TableContainer elevation={0} component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={'85%'}>Item</TableCell>
              <TableCell sx={{ minWidth: 100 }} align='center'>Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cart.map(x => x[1].map((cartEntry: CartEntry) => (
              <TableRow key={cartEntry.id} className={`cart-item${productHasSelectableModifiers(cartEntry.id, menu) ? " editible" : ""}`}>
                <TableCell sx={{ py: 0 }}>
                  <ProductDisplay productMetadata={cartEntry.product.m} description menuModifiers={menu.modifiers} displayContext="order" />
                </TableCell>
                <TableCell sx={{ py: 1 }}>
                  <Grid container alignContent={'center'} >
                    <Grid item sx={{ p: 1, alignContent: 'center' }} xs={12}>
                      <CheckedNumericInput
                        size='small'
                        type="number"
                        fullWidth
                        inputProps={{ inputMode: 'numeric', min: 1, max: 99, pattern: '[0-9]*', step: 1 }}
                        value={cartEntry.quantity}
                        disabled={cartEntry.isLocked}
                        onChange={(value) => setEntryQuantity(cartEntry.id, value)}
                        parseFunction={parseInt}
                        allowEmpty={false} />
                    </Grid>
                    <Grid item sx={{ py: 1, pl: 1, textAlign: 'center' }} xs={6} >
                      <IconButton disabled={cartEntry.isLocked} name="remove" onClick={() => setRemoveEntry(cartEntry.id)} >
                        <RemoveFromCart /></IconButton>
                    </Grid>
                    <Grid item sx={{ py: 1, pr: 1, textAlign: 'center' }} xs={6}>
                      {productHasSelectableModifiers(cartEntry.id, menu) &&
                        <IconButton
                          disabled={isProductEditDialogOpen || cartEntry.isLocked}
                          onClick={() => setProductToEdit(cartEntry)}
                        >
                          <Edit />
                        </IconButton>}
                    </Grid>
                  </Grid>
                </TableCell>
              </TableRow>
            ))).flat()}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
};
