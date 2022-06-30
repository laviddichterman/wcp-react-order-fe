import { GenerateMenu, IMenu } from '@wcp/wcpshared';
import React, { createContext, useEffect, useState } from 'react';
import { useAppSelector } from './useHooks';

// ----------------------------------------------------------------------

interface MenuState {
  menu: IMenu | null;
}
const initialState : MenuState = {
  menu: null
};

const MenuContext = createContext<MenuState>(initialState);

// ----------------------------------------------------------------------

function MenuProvider({ children } : { children : React.ReactNode }) {
  const catalog = useAppSelector((s) => s.ws.catalog);
  const loadTime = useAppSelector((s) => s.metrics.pageLoadTime);
  const [menu, setMenu] = useState<IMenu | null>(null);
  useEffect(() => {
    if (catalog !== null && loadTime !== null) {
      const MENU = GenerateMenu(catalog, new Date(loadTime));
      setMenu(MENU);
    }
  }, [catalog, loadTime]);

  return (<MenuContext.Provider value={{menu}}>
      {children}
    </MenuContext.Provider>);
}

export { MenuProvider, MenuContext };

