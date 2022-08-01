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

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 350,
      md: 750,
      lg: 935,
      xl: 1250,
    },
  },
  zIndex: {
    snackbar: 2500
  },
  typography: {
    allVariants: {
      fontFamily: 'Cabin',
    },
    fontFamily: '"Cabin", "Source Sans Pro"',
    fontSize: 13,
    h1: {
      fontFamily: 'Source Sans Pro',
      textTransform: 'uppercase',
    },
    h2: {
      fontFamily: 'Source Sans Pro',
      textTransform: 'uppercase',
    },
    h3: {
      fontFamily: 'Source Sans Pro',
      textTransform: 'uppercase',
    },
    h4: {
      fontFamily: 'Source Sans Pro',
      textTransform: 'uppercase',
    },
    h5: {
      fontFamily: 'Source Sans Pro',
      textTransform: 'uppercase',
      fontWeight: 600,
    },
  },
  components: {
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: "1px solid #000000",
          backgroundColor: '#fcfcfc',
        }
      }
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '& input': {
            padding: '16.5px 14px',
            border: 0,
            outlineWidth: 0,
            '&:focus': {
              outlineWidth: 0,
            }
          }
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        content: {
          margin: "0px",
        },
        root: {
          paddingLeft: 0,
          borderBottom: '1px solid',
        }
      }
    },
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
          "&.Mui-selected": {
            backgroundColor: "#c59d5f"
          },
          "&:hover": {
            backgroundColor: "#c59d5f"
          },
        },
      }
    },
    MuiGrid: {
      styleOverrides: {
        
      }
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          backgroundColor: "black",
          "&.Mui-disabled": {
            pointerEvents: "unset",
            cursor: "not-allowed",
            backgroundColor: "#D3D3D3",
            color: 'black'
          },
          "&.Mui-selected": {
            color: 'white',
            backgroundColor: "#c59d5f",
            "&:hover": {
              color: 'white',
              backgroundColor: "#c59d5f"
            },
          },
          "&:hover": {
            color: 'white',
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
            
            {/* {!isSocketDataLoaded ? <LoadingScreen /> : <WOrderingComponent />} */}
            {!isSocketDataLoaded ? <LoadingScreen /> : <WMenuComponent />}
          </div>
        </SnackbarProvider>
      </ThemeProvider>
    </ScopedCssBaseline>
  );
};

export default App;
