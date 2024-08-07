import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppSelector } from "../../app/useHooks";
import { store } from '../../app/store';
import { Typography, Grid } from '@mui/material';
import { IProductInstance, MoneyToDisplayString, IMoney, IProduct } from '@wcp/wcpshared';
import { getProductEntryById, getProductInstanceById, weakMapCreateSelector } from '@wcp/wario-ux-shared';
import { isEqual } from 'lodash';

import {
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
  DataGridPremium,
  GridRowGroupingModel,
  useKeepGroupedColumnsHidden,
  useGridApiRef,
  GridEventListener
} from '@mui/x-data-grid-premium';
import { createStructuredSelector } from 'reselect';
import { SelectProductInstanceIdsInCategoryForNextAvailableTime, SelectProductMetadataForMenu } from './WMenuComponent';
import { RootState } from '../../app/store';

export interface ToolbarAction {
  size: number; elt: React.ReactNode;
}
export interface CustomToolbarProps {
  showQuickFilter?: boolean;
  quickFilterProps: GridToolbarQuickFilterProps;
  title: React.ReactNode;
  actions: ToolbarAction[];
}


function CustomToolbar({ showQuickFilter, quickFilterProps, title, actions = [] }: CustomToolbarProps) {
  const actionSizeSum = actions.reduce((acc, x) => acc + x.size, 0);
  return (
    <GridToolbarContainer >
      <Grid container item xs={12} sx={{ m: 'auto', width: '100%' }}>
        <Grid item xs={showQuickFilter ? 12 : 12 - actionSizeSum} md={showQuickFilter ? 6 : 12 - actionSizeSum}>
          <Typography variant="h5">{title}</Typography>
        </Grid>
        {showQuickFilter &&
          <Grid sx={{ py: 1 }} item xs={12 - actionSizeSum} md={6 - actionSizeSum} >
            <GridToolbarQuickFilter {...quickFilterProps} />
          </Grid>
        }
        {actions.map((action, idx) => (<Grid item sx={{ py: 1 }} xs={action.size} key={idx}>{action.elt}</Grid>))}
      </Grid>
    </GridToolbarContainer>
  );
}
type RowType = {
  category: string;
  subcategoryI?: string;
  subcategoryII?: string;
  subcategoryIII?: string;
  name: string;
  price: string;
  metadata: {};
  id: string;
}
interface WMenuDisplayProps { categoryId: string; };
interface DGEmbeddedMetadata { size: number; ordinal: number; key: string };
const DataGridMetadataPrefix = /DG_(S(?<size>\d)_)?(O(?<ordinal>-?\d)_)?(?<name>.*)/;

// interface HierarchicalProductStructure {
//   category: string;
//   subcategories: { [index: string]: HierarchicalProductStructure };
//   products: IProductInstance[];
// };

// function GenerateHierarchicalProductStructure(acc: HierarchicalProductStructure, curr: IProductInstance, depth: number): HierarchicalProductStructure {
//   const splitCats =  (curr.externalIDs.find(ext => ext.key === "Categories")?.value ?? "").split(',');
//   if (depth < splitCats.length) {
//     acc.subcategories[splitCats[depth]] = GenerateHierarchicalProductStructure(
//       Object.hasOwn(acc.subcategories, splitCats[depth]) ?
//         acc.subcategories[splitCats[depth]] :
//         {
//           category: splitCats[depth],
//           products: [],
//           subcategories: {}
//         }, curr, depth + 1);
//     return acc;
//   }
//   return { ...acc, products: [...acc.products, curr] } as HierarchicalProductStructure;
// }
const SelectProductInstanceForMenu = createStructuredSelector(
  {
    categories: (s: RootState, productInstanceId: string) => {
      const pi = getProductInstanceById(s.ws.productInstances, productInstanceId);
      return pi ? (pi.externalIDs.find(ext => ext.key === "Categories")?.value ?? "").split(',') : []
    },
    name: (s: RootState, productInstanceId: string) => SelectProductMetadataForMenu(s, productInstanceId).name,
    price: (s: RootState, productInstanceId: string) => SelectProductMetadataForMenu(s, productInstanceId).price,
    metadata: (s: RootState, productInstanceId: string) => getProductInstanceById(s.ws.productInstances, productInstanceId)!.externalIDs.reduce((acc, kv) => kv.value.length ? { ...acc, [kv.key]: kv.value } : acc, {})
  },
  weakMapCreateSelector
);


const ComputeRows = (productRows: string[]): RowType[] => {
  return productRows.map(x => {
    const data = SelectProductInstanceForMenu(store.getState(), x);
    return ({
      id: x,
      category: data.categories.join(" > "),
      // subcategoryI: data.categories[1],
      // subcategoryII: data.categories[2],
      // subcategoryIII: data.categories[3],
      name: data.name,
      price: MoneyToDisplayString(data.price, false),
      metadata: data.metadata
    }) satisfies RowType;
  });
}


  function MenuDataGridInner({ productRows }: { productRows: string[] }) {
    const [versionedProductRows, setVersionedProductRows] = useState<string[]>([]);

    useEffect(() => {
      if (!isEqual(productRows, versionedProductRows)) {
        setVersionedProductRows(productRows);
      }
    }, [productRows, versionedProductRows]);

    const memoizedComputedRows = useMemo(() => {
      return ComputeRows(versionedProductRows);
    }, [versionedProductRows]); // Depend on the "versioned" state

    const apiRef = useGridApiRef();
    const onRowClick = React.useCallback<GridEventListener<'rowClick'>>(
      (params) => {
        const rowNode = apiRef.current.getRowNode(params.id);
        if (rowNode && rowNode.type === 'group') {
          apiRef.current.setRowChildrenExpansion(params.id, !rowNode.childrenExpanded);
        }
      },
      [apiRef],
    );

    const initialState = useKeepGroupedColumnsHidden({
      apiRef,
      initialState: {
        rowGrouping: {
          // model: ['category', 'subcategoryI', 'subcategoryII', 'subcategoryIII'],
        },
      },
    });

    return (
      <DataGridPremium
        apiRef={apiRef}
        onRowClick={onRowClick}
        initialState={initialState}
        density="compact"
        componentsProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}
        components={{
          Toolbar: CustomToolbar
        }
        }
        // autoHeight
        columns={[
          { headerName: "Category", field: "category", flex: 2 },
          // { headerName: "SubCategory I", field: "subcategoryI", flex: 1 },
          // { headerName: "SubCategory II", field: "subcategoryII", flex: 1 },
          // { headerName: "SubCategory III", field: "subcategoryIII", flex: 1 },
          { headerName: "Name", field: "name", flex: 5 },
          //...dynamicColumns,
          { headerName: "Price", field: "price", flex: 1 }
        ]}

        rows={memoizedComputedRows}
      />
    );
  }

  export function WMenuDataGrid({ categoryId }: WMenuDisplayProps) {
    //const SelectCategoryListForProductInstanceId = useAppSelector(s=>(productInstanceId: string) => SelectProductInstanceForMenu(s, productInstanceId).categories);
    const [rowGroupingModel, setRowGroupingModel] =
      React.useState<GridRowGroupingModel>(['category']);
    const productRows = useAppSelector(s => SelectProductInstanceIdsInCategoryForNextAvailableTime(s, categoryId, 'Menu'));


    // const dynamicColumns: GridColDef<{ id: string; }>[] = useMemo(() => {
    //   const acc: Record<string, DGEmbeddedMetadata> = {};
    //   productRows.forEach((piid) => {
    //     const pi = productInstanceSelector(piid)
    //     return pi.externalIDs.forEach(md => {
    //     if (md.value.length > 0) {
    //       const keyMatch = md.key.match(DataGridMetadataPrefix);
    //       if (keyMatch?.groups) {
    //         acc[keyMatch.groups.name] = { ordinal: Number.parseInt(keyMatch.groups.ordinal ?? "1"), size: Number.parseInt(keyMatch.groups.ordinal ?? "3"), key: md.key };
    //       }
    //     }
    //   })}
    // );
    // { headerName: "Ordinal", field: "ordinal", valueGetter: (v: ValueGetterRow) => v.row.category.ordinal, flex: 3 },
    return <MenuDataGridInner productRows={productRows} />;
  }
