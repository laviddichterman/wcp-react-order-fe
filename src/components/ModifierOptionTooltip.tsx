import { useAppSelector } from '../app/useHooks';
import { useMemo } from 'react';
import { OptionEnableState, WCPOption, DISABLE_REASON, WFunctional } from '@wcp/wcpshared';
import { Tooltip } from '@mui/material';
import { getProductInstanceFunctionById } from '../app/slices/SocketIoSlice';

interface ModifierOptionTooltipProps {
  enableState: OptionEnableState;
  option: WCPOption;
  children: React.ReactNode;
}

export function ModifierOptionTooltip({ enableState, option, children }: ModifierOptionTooltipProps) {
  const SERVICES = useAppSelector(s => s.ws.services!);
  const selectedProduct = useAppSelector(s=>s.customizer.selectedProduct);
  const catalog = useAppSelector(s=>s.ws.catalog!);
  const pifGetter = useAppSelector(s=>(pifId : string)=> getProductInstanceFunctionById(s.ws.productInstanceFunctions, pifId));
  
  const tooltipText = useMemo(() => {
    const displayName = option.mo.item.display_name;
    switch (enableState.enable) {
      case DISABLE_REASON.ENABLED:
        return displayName;
      case DISABLE_REASON.DISABLED_TIME:
        return `We're out of ${displayName} at the moment.`;
      case DISABLE_REASON.DISABLED_BLANKET:
        return `${displayName} is disabled until further notice.`;
      case DISABLE_REASON.DISABLED_FLAVORS:
        return `Adding ${displayName} would exceed maximum flavor count.`;
      case DISABLE_REASON.DISABLED_WEIGHT:
        return `Adding ${displayName} would exceed maximum weight.`;
      case DISABLE_REASON.DISABLED_FULFILLMENT_TYPE:
        return `${displayName} is disabled for ${SERVICES[enableState.fulfillment]}.`;
      case DISABLE_REASON.DISABLED_NO_SPLITTING:
        return `${displayName} is disabled as a split modifier.`;
      case DISABLE_REASON.DISABLED_SPLIT_DIFFERENTIAL:
        return `Adding ${displayName} would throw off balance.`;
      case DISABLE_REASON.DISABLED_MAXIMUM:
        return `Adding ${displayName} would exceed the maximum modifiers allowed of this type.`;
      case DISABLE_REASON.DISABLED_FUNCTION:
        const PIF = pifGetter(enableState.functionId);
        if (PIF && selectedProduct) {
          const trackedFailure = WFunctional.ProcessAbstractExpressionStatementWithTracking(selectedProduct.p, PIF.expression, catalog);
          return `${displayName} requires ${WFunctional.AbstractExpressionStatementToHumanReadableString(trackedFailure[1][0], catalog.modifiers)}`;
        }
        return `${displayName} is not available with the current combination of options.`;
    }
    //return displayName;
  }, [enableState, option, SERVICES, pifGetter, catalog, selectedProduct]);
  return enableState.enable === DISABLE_REASON.ENABLED ?
    <span>{children}</span> :
    <Tooltip arrow title={tooltipText}>
      <span>{children}</span>
    </Tooltip>;
};
