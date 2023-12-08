import { useEffect, useLayoutEffect, useMemo } from 'react';
import { SnackbarProvider } from 'notistack';
import { LazyMotion, domMax } from "framer-motion"
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ScopedCssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';

import { scrollToIdOffsetAfterDelay, LoadingScreen, AdapterCurrentTimeOverrideUtils, SocketIoActions, IsSocketDataLoaded } from '@wcp/wario-ux-shared';

import { setUserAgent } from './app/slices/WMetricsSlice';
import { useAppDispatch, useAppSelector } from "./app/useHooks";
import { themeOptions } from './components/styled/styled';

//import React from 'react';
import WStoreCreditPurchase from './components/WStoreCreditPurchase';
import WMenuComponent from './components/menu/WMenuComponent';
import WOrderingComponent from './components/WOrderingComponent';

const theme = createTheme(themeOptions);

/**
 * 
 * TO LAUNCH CHECKLIST
 * Fix display of apple pay and google pay
 * Ensure we're passing everything we need to apple/google pay for itemized receipt creation
 * change from react-hook-form to just put shit in the redux state
 * don't let people select a tip if they're not paying due to special instructions or whatever
 * fix the X scrolling in the checkout cart (hide some shit, make it smaller)
\ * checkout cart formatting and handle the wario payment being processed
 */


const LazyLoadingPage = () => 
<LazyMotion features={domMax}>
<LoadingScreen />
</LazyMotion>


const App = () => {
  const dispatch = useAppDispatch();
  const socketIoState = useAppSelector((s) => s.ws.status);
  const isSocketDataLoaded = useAppSelector(s => IsSocketDataLoaded(s.ws));
  const currentTime = useAppSelector(s => s.ws.currentTime);
  const DateAdapter = useMemo(() => AdapterCurrentTimeOverrideUtils(currentTime), [currentTime]);
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
        <SnackbarProvider style={{ zIndex: 999999 }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          {!isSocketDataLoaded || currentTime === 0 ?
            <LazyLoadingPage /> :
            <LocalizationProvider dateAdapter={DateAdapter}>
              <div id="WARIO_order">
                {/* <Grid item xs={12} height={100} sx={{ pb: 5, minHeight: 100 }}>&nbsp;</Grid> */}
                {/* { <WStoreCreditPurchase />} */}
                {/* {<WMenuComponent />} */}
                {<WOrderingComponent />}
              </div>
            </LocalizationProvider>
          }
        </SnackbarProvider>
      </ThemeProvider>
    </ScopedCssBaseline>
  );
};

export default App;


// const WStoreCreditPurchase = React.lazy(() => import('./components/WStoreCreditPurchase'));
// const WMenuComponent = React.lazy(() => import('./components/menu/WMenuComponent'));
// const WOrderingComponent = React.lazy(() => import('./components/WOrderingComponent'));
