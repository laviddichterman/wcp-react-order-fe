import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ScopedCssBaseline } from '@mui/material';
import { SnackbarProvider } from 'notistack';
import { useEffect } from 'react';
import { SocketIoActions, IsSocketDataLoaded } from './app/slices/SocketIoSlice';
import { setUserAgent } from './app/slices/WMetricsSlice';
import { useAppDispatch, useAppSelector } from "./app/useHooks";
import LoadingScreen from './components/LoadingScreen';
import { WOrderingComponent } from './components/WOrderingComponent';
// import { WStoreCreditPurchase } from './components/WStoreCreditPurchase';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 350,
      md: 654,
      lg: 850,
      xl: 1100,
    },
  },
  typography: {
    allVariants: {
      fontFamily: 'Cabin'
    }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "black",
          "&.Mui-disabled": {
            pointerEvents: "unset",
            cursor: "not-allowed",
            backgroundColor: "#D3D3D3",
            color: 'black'
          },
          "&:hover": {
            backgroundColor: "#c59d5f"
          },
        },
      }
    }
  }
});

/**
 * 
 * TO LAUNCH CHECKLIST
 * 
 * ALLOW_SLICING
 * accordion formatting
 * product formatting
 * checkout cart formatting and handle the wario payment being processed
 * prevent selecting a service for which the selected options don't allow
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

  return (
    <ScopedCssBaseline>
      <ThemeProvider theme={theme}>
        <SnackbarProvider anchorOrigin={{ horizontal: 'right', vertical: 'top' }}>
          {/* <WStoreCreditPurchase /> */}
          {!isSocketDataLoaded ? <LoadingScreen /> : <WOrderingComponent />}
        </SnackbarProvider>
      </ThemeProvider>
    </ScopedCssBaseline>
  );
};

export default App;
