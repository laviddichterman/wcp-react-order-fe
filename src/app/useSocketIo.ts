import { useContext } from 'react';
//
import { SocketIoContext } from '../contexts/SocketIoContext';


// ----------------------------------------------------------------------

const useSocketIo = () => {
  const context = useContext(SocketIoContext);

  if (!context) throw new Error('useSocketIo context must be use inside SocketIoContext');

  return context;
};

export default useSocketIo;
