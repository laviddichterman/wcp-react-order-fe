import { useAppSelector } from '../app/useHooks';
import { useMemo } from 'react';
import { OptionEnableState, DISABLE_REASON, WFunctional, IOption } from '@wcp/wcpshared';
import { Tooltip } from '@mui/material';
import { CatalogSelectors, getFulfillments, getProductInstanceFunctionById } from '@wcp/wario-ux-shared';

interface ModifierOptionTooltipProps {
  enableState: OptionEnableState;
  option: IOption;
  children: React.ReactNode;
}

export function ModifierOptionTooltip({ enableState, option, children }: ModifierOptionTooltipProps) {
  const fulfillments = useAppSelector(s => getFulfillments(s.ws.fulfillments));
  const selectedProduct = useAppSelector(s=>s.customizer.selectedProduct);
  const catalogSelectors = useAppSelector(s=>CatalogSelectors(s.ws));
  const pifGetter = useAppSelector(s=>(pifId : string)=> getProductInstanceFunctionById(s.ws.productInstanceFunctions, pifId));
  
  const tooltipText = useMemo(() => {
    const displayName = option.displayName;
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
        return `${displayName} is disabled for ${fulfillments.find(x=>x.id === enableState.fulfillment)!.displayName}.`;
      case DISABLE_REASON.DISABLED_NO_SPLITTING:
        return `${displayName} is disabled as a split modifier.`;
      case DISABLE_REASON.DISABLED_SPLIT_DIFFERENTIAL:
        return `Adding ${displayName} would throw off balance.`;
      case DISABLE_REASON.DISABLED_MAXIMUM:
        return `Adding ${displayName} would exceed the maximum modifiers allowed of this type.`;
      case DISABLE_REASON.DISABLED_FUNCTION:
        const PIF = pifGetter(enableState.functionId);
        if (PIF && selectedProduct) {
          const trackedFailure = WFunctional.ProcessAbstractExpressionStatementWithTracking(selectedProduct.p.modifiers, PIF.expression, catalogSelectors);
          return `${displayName} requires ${WFunctional.AbstractExpressionStatementToHumanReadableString(trackedFailure[1][0], catalogSelectors)}`;
        }
        return `${displayName} is not available with the current combination of options.`;
    }
    //return displayName;
  }, [enableState, option, fulfillments, pifGetter, catalogSelectors, selectedProduct]);
  return enableState.enable === DISABLE_REASON.ENABLED ?
    <span>{children}</span> :
    <Tooltip arrow title={tooltipText}>
      <span>{children}</span>
    </Tooltip>;
};
