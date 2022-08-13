import { Middleware } from 'redux'
import { useAppDispatch } from '../useHooks';
import { RootState } from '../store';

const StepperMiddleware: Middleware<{}, RootState> = store => {  
  return next => action => {

    next(action);
  }
}

export default StepperMiddleware;