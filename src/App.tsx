import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ScopedCssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useEffect, useLayoutEffect } from 'react';
import { SocketIoActions, IsSocketDataLoaded } from './app/slices/SocketIoSlice';
import { setUserAgent } from './app/slices/WMetricsSlice';
import { useAppDispatch, useAppSelector } from "./app/useHooks";
import LoadingScreen from './components/LoadingScreen';
import { WOrderingComponent } from './components/WOrderingComponent';
import { WStoreCreditPurchase } from './components/WStoreCreditPurchase';
import { scrollToIdOffsetAfterDelay } from './utils/shared';
import { WMenuComponent } from './components/menu/WMenuComponent';
import { themeOptions } from './components/styled/styled';

const theme = createTheme(themeOptions);

/**
 * 
 * TO LAUNCH CHECKLIST
 * 
 * ALLOW_SLICING
 * * order guide
 * change from react-hook-form to just put shit in the redux state
 * don't let people select a tip if they're not paying due to special instructions or whatever
 * fix the X scrolling in the checkout cart (hide some shit, make it smaller)
\ * checkout cart formatting and handle the wario payment being processed
 * prevent selecting a service for which the selected options don't allow
* state why something is disabled when hovered over via tooltip => PUSH TO NEXT VERSION
* revalidate service time on submit
 */


const App = () => {
  const dispatch = useAppDispatch();
  const socketIoState = useAppSelector((s) => s.ws.status);
  const isSocketDataLoaded = useAppSelector(s => IsSocketDataLoaded(s.ws));
  useEffect(() => {
    if (socketIoState === 'NONE') {
      dispatch(SocketIoActions.startConnection());
    }
    dispatch(setUserAgent(window.navigator.userAgent));
  }, [socketIoState, dispatch]);

  useLayoutEffect(() => {
    if (isSocketDataLoaded) { 
      scrollToIdOffsetAfterDelay('WARIO_order', 100, -100);
    }
  }, [isSocketDataLoaded])
  return (
    <ScopedCssBaseline>
      <ThemeProvider theme={theme}>
        <SnackbarProvider style={{zIndex: 2400}} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          <div id="WARIO_order">
            {/* <Grid item xs={12} height={100} sx={{ pb: 5, minHeight: 100 }}>&nbsp;</Grid> */}
            {/* {!isSocketDataLoaded ? <LoadingScreen /> : <WStoreCreditPurchase />} */}
            
            {!isSocketDataLoaded ? <LoadingScreen /> : <WOrderingComponent />}
            {/* {!isSocketDataLoaded ? <LoadingScreen /> : <WMenuComponent />} */}
          </div>
        </SnackbarProvider>
      </ThemeProvider>
    </ScopedCssBaseline>
  );
};

export default App;
