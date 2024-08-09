import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppSelector } from "../../app/useHooks";
import { store } from '../../app/store';
import { Typography, Grid, Stack, Box } from '@mui/material';
import { getProductInstanceById, WarioToggleButton, weakMapCreateSelector } from '@wcp/wario-ux-shared';
import { isEqual } from 'lodash';

import {
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
  DataGridPremium,
  GridRowGroupingModel,
  useKeepGroupedColumnsHidden,
  useGridApiRef,
  GridEventListener,
  gridClasses,
  GridFilterModel,
  getGridStringOperators
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
  subcategory0: string;
  subcategory1: string;
  subcategory2: string;
  subcategory3: string;
  name: string;
  price: number;
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
      subcategory0: data.categories[0],
      subcategory1: data.categories.length > 1 ? data.categories[1] : "",
      subcategory2: data.categories.length > 2 ? data.categories[2] : "",
      subcategory3: data.categories.length > 3 ? data.categories[3] : "",
      name: data.name,
      price: data.price.amount,
      metadata: data.metadata
    }) satisfies RowType;
  });
}


function MenuDataGridInner({ productRows }: { productRows: string[] }) {
  const [versionedProductRows, setVersionedProductRows] = useState<string[]>([]);
  const [selectedFilterModel, setSelectedFilterModel] = useState<number>(0);
  useEffect(() => {
    if (!isEqual(productRows, versionedProductRows)) {
      setVersionedProductRows(productRows);
    }
  }, [productRows, versionedProductRows]);

  const memoizedComputedRows = useMemo(() => {
    return ComputeRows(versionedProductRows);
  }, [versionedProductRows]); // Depend on the "versioned" state

  // return a list of predefined filters for each subcategory0
  const predefinedFilters: { label: string; filterModel: GridFilterModel }[] = useMemo(() => {
    const uniqueStatuses = new Set(memoizedComputedRows.map(x => x.subcategory0));
    return [{
      label: 'All',
      filterModel: { items: [] },
    }, ...Array.from(uniqueStatuses).map((status) => ({
      label: status,
      filterModel: { items: [{ field: 'subcategory0', operator: 'equals', value: status }] },
    }))];
  }, [memoizedComputedRows]);

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
  const [predefinedFiltersRowCount, setPredefinedFiltersRowCount] = useState<number[]>([]);
  const getFilteredRowsCount = useCallback(
    (filterModel: GridFilterModel) => {
      const { filteredRowsLookup } = apiRef.current.getFilterState(filterModel);
      return Object.keys(filteredRowsLookup).filter(
        (rowId) => filteredRowsLookup[rowId] === true,
      ).length;
    }, [apiRef, predefinedFilters]);

  useEffect(() => {
    // Calculate the row count for predefined filters
    if (memoizedComputedRows.length === 0) {
      return;
    }

    setPredefinedFiltersRowCount(
      predefinedFilters.map(({ filterModel }) => getFilteredRowsCount(filterModel)),
    );
  }, [apiRef, memoizedComputedRows, getFilteredRowsCount]);
  const handleSelectFilterModel = useCallback((index: number) => {
    setSelectedFilterModel(index);
    apiRef.current.setFilterModel(predefinedFilters[index].filterModel);
  }, [apiRef, predefinedFilters]);

  const initialState = useKeepGroupedColumnsHidden({
    apiRef,
    initialState: {
      columns: {
        columnVisibilityModel: {
          subcategory0: false,
          subcategory1: false,
          subcategory2: false,
          subcategory3: false,
        }
      }
    },
  });

  return (
    <div style={{ overflow: 'hidden' }}>
      <Stack direction="row" gap={1} mb={1} mx={1} flexWrap="wrap">
        {predefinedFilters.map(({ label, filterModel }, index) => {
          const count = predefinedFiltersRowCount[index];
          return (

            <WarioToggleButton
              key={label}
              onClick={() => handleSelectFilterModel(index)}
              selected={selectedFilterModel === index} 
              value={index} >
              {label} {count !== undefined ? `(${count})` : ''}
            </WarioToggleButton>
          );
        })}
      </Stack>
      <Box sx={{ height: 520, width: '100%' }}>
        <DataGridPremium
          sx={{
            [`& .${gridClasses.cell}:focus, & .${gridClasses.cell}:focus-within`]: {
              outline: 'none',
            },
            [`& .${gridClasses.columnHeader}:focus, & .${gridClasses.columnHeader}:focus-within`]:
            {
              outline: 'none',
            },
          }}
          ignoreDiacritics
          apiRef={apiRef}
          getRowHeight={() => 'auto'}
          onRowClick={onRowClick}
          initialState={initialState}
          density="compact"
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}

          // autoHeight
          columns={[
            { headerName: "Category", field: "category", flex: 2 },
            { headerName: "subcategory0", field: "subcategory0", filterOperators: getGridStringOperators(), },
            { headerName: "subcategory1", field: "subcategory1", filterOperators: getGridStringOperators() },
            { headerName: "subcategory2", field: "subcategory2", filterOperators: getGridStringOperators() },
            { headerName: "subcategory3", field: "subcategory3", filterOperators: getGridStringOperators() },
            { headerName: "Name", field: "name", flex: 5, aggregable: false, },
            //...dynamicColumns,
            { headerName: "Price", field: "price", flex: 1, type: 'number', valueFormatter: (value, _row) => value / 100 },
          ]}

          rows={memoizedComputedRows}
        />
      </Box>
    </div>
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