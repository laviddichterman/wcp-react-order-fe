import React, { useEffect } from 'react';
import { SocketIoActions } from './app/SocketIoSlice';
import { useAppDispatch, useAppSelector } from "./app/useHooks";
import { WOrderingComponent } from './components/WOrderingComponent';


const App = () => {
  const dispatch = useAppDispatch();
  const socketIoState = useAppSelector((s) => s.ws.status);
  // const catalog = useAppSelector((s) => s.ws.catalog);
  // const [menu, setMenu] = useState<IMenu | null>(null);
  // const [displayMenu, setDisplayMenu] = useState<string[]>([]);
  useEffect(() => {
    if (socketIoState === 'NONE') { 
      console.log("hiiii")
      dispatch(SocketIoActions.startConnection());
    }
  }, [socketIoState, dispatch]);
  return (
    <article className="article--page article--main border-simple post-69 page type-page status-publish has-post-thumbnail hentry">
      <section className="article__content">
        <div className="container">
          <section className="page__content js-post-gallery cf">
            <WOrderingComponent />
          </section>
        </div>
      </section>
    </article>
  );
};

export default App;
