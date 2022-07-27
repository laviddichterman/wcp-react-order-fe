import { ThemeProvider, createTheme } from '@mui/material/styles';
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
      md: 514,
      lg: 675,
      xl: 1536,
    },
  },
  typography: {
    allVariants: {
      fontFamily: 'Cabin'
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
    <ThemeProvider theme={theme}>
    <SnackbarProvider anchorOrigin={{horizontal: 'right', vertical: 'top'}}>
      <article className="article--page article--main border-simple post-69 page type-page status-publish has-post-thumbnail hentry">
        <section className="article__content">
          <div className="container">
            <section className="page__content js-post-gallery cf">
              {/* <WStoreCreditPurchase /> */}
              { !isSocketDataLoaded ? <LoadingScreen /> : <WOrderingComponent /> } 
            </section>
          </div>
        </section>
      </article>
    </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;
