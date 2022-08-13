import { useEffect, useLayoutEffect, useMemo } from 'react';
import { SnackbarProvider } from 'notistack';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ScopedCssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';

import { SocketIoActions, IsSocketDataLoaded } from './app/slices/SocketIoSlice';
import { setUserAgent } from './app/slices/WMetricsSlice';
import { useAppDispatch, useAppSelector } from "./app/useHooks";
import LoadingScreen from './components/LoadingScreen';
import { themeOptions } from './components/styled/styled';
import { scrollToIdOffsetAfterDelay } from './utils/shared';

// import { WStoreCreditPurchase } from './components/WStoreCreditPurchase';
// import { WMenuComponent } from './components/menu/WMenuComponent';
import { WOrderingComponent } from './components/WOrderingComponent';
import { CurrentDateAndTzDateFnsUtils } from './utils/date-fns-tz-utils';

const theme = createTheme(themeOptions);

/**
 * 
 * TO LAUNCH CHECKLIST
 * 
 * change from react-hook-form to just put shit in the redux state
 * don't let people select a tip if they're not paying due to special instructions or whatever
 * fix the X scrolling in the checkout cart (hide some shit, make it smaller)
\ * checkout cart formatting and handle the wario payment being processed
 */


const App = () => {
  const dispatch = useAppDispatch();
  const socketIoState = useAppSelector((s) => s.ws.status);
  const isSocketDataLoaded = useAppSelector(s => IsSocketDataLoaded(s.ws));
  const currentTime = useAppSelector(s => s.metrics.currentTime);
  const DateAdapter = useMemo(() => CurrentDateAndTzDateFnsUtils(currentTime), [currentTime]);
  useEffect(() => {
    if (socketIoState === 'NONE') {
      dispatch(SocketIoActions.startConnection());
    }
    dispatch(setUserAgent(window.navigator.userAgent));
  }, [socketIoState, dispatch]);

  useLayoutEffect(() => {
    if (isSocketDataLoaded && currentTime !== 0) {
      scrollToIdOffsetAfterDelay('WARIO_order', 100, -100);
    }
  }, [isSocketDataLoaded, currentTime])
  return (
    <ScopedCssBaseline>
      <ThemeProvider theme={theme}>
        <SnackbarProvider style={{ zIndex: 999999 }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
          {!isSocketDataLoaded || currentTime === 0 ?
            <LoadingScreen /> :
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
