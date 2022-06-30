import { useContext } from 'react';
import { MenuContext } from './MenuContext';

// ----------------------------------------------------------------------

const useMenu = () => useContext(MenuContext);

export default useMenu;
