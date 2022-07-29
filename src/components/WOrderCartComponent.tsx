import { WProductComponent } from './WProductComponent';
import { getCart, removeFromCart, updateCartQuantity } from '../app/slices/WCartSlice';
import { useAppDispatch, useAppSelector } from '../app/useHooks';
import { useCallback } from 'react';
import { IMenu, CartEntry } from '@wcp/wcpshared';
import { IconButton, Grid, TableContainer, Table, TableCell, TableHead, TableBody, Typography, Paper, TableRow } from '@mui/material';
import { Clear, Edit } from '@mui/icons-material';
import { GetSelectableModifiersForCartEntry } from '../app/store';
import { CheckedNumericInput } from './CheckedNumericTextInput';

interface IOrderCart {
  menu: IMenu;
  isProductEditDialogOpen: boolean;
  setProductToEdit: (entry: CartEntry) => void;
}

export function WOrderCart({ menu, isProductEditDialogOpen, setProductToEdit }: IOrderCart) {
  const dispatch = useAppDispatch();
  const cart = useAppSelector(s => getCart(s.cart.cart));
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
      <Typography sx={{ p: 2 }}>Current Order</Typography>
      <TableContainer elevation={0} component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={'85%'}>Item</TableCell>
              <TableCell sx={{ minWidth: 100 }} align='center'>Quantity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cart.map((cartEntry, i: number) =>
              <TableRow style={i % 2 ? { background: "#fcfcfc" } : { background: "white" }} key={i} className={`cart-item${productHasSelectableModifiers(cartEntry.id, menu) ? " editible" : ""}`}>
                <TableCell sx={{ py: 0 }}>
                  <WProductComponent productMetadata={cartEntry.product.m} description allowAdornment={false} dots={false} menuModifiers={menu.modifiers} displayContext="order" price={false} />
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
                      <IconButton size="small" disabled={cartEntry.isLocked} name="remove" onClick={() => setRemoveEntry(cartEntry.id)} >
                        <Clear /></IconButton>
                    </Grid>
                    <Grid item sx={{ py: 1, pr: 1, textAlign: 'center' }} xs={6}>
                      {productHasSelectableModifiers(cartEntry.id, menu) &&
                        <IconButton
                          size="small"
                          disabled={isProductEditDialogOpen || cartEntry.isLocked}
                          onClick={() => setProductToEdit(cartEntry)}
                        >
                          <Edit />
                        </IconButton>}
                    </Grid>
                  </Grid>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
};
