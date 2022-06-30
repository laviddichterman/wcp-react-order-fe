import { SnackbarProvider } from 'notistack';
import React, { useEffect } from 'react';
import { SocketIoActions, IsSocketDataLoaded } from './app/SocketIoSlice';
import { useAppDispatch, useAppSelector } from "./app/useHooks";
import { WOrderingComponent } from './components/WOrderingComponent';


const App = () => {
  const dispatch = useAppDispatch();
  const socketIoState = useAppSelector((s) => s.ws.status);
  const isSocketDataLoaded = useAppSelector(s=>IsSocketDataLoaded(s.ws));
  useEffect(() => {
    if (socketIoState === 'NONE') { 
      dispatch(SocketIoActions.startConnection());
    }
  }, [socketIoState, dispatch]);
  if (!isSocketDataLoaded) {
    return <div>Loading...</div>
  }
  return (
    <SnackbarProvider>
    <article className="article--page article--main border-simple post-69 page type-page status-publish has-post-thumbnail hentry">
      <section className="article__content">
        <div className="container">
          <section className="page__content js-post-gallery cf">
            <WOrderingComponent />
          </section>
        </div>
      </section>
    </article>
    </SnackbarProvider>
  );
};

export default App;
