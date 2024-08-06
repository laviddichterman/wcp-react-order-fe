import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from "../../app/useHooks";
import { Typography, Grid } from '@mui/material';
import { IProductInstance, MoneyToDisplayString, IMoney, IProduct } from '@wcp/wcpshared';
import { getProductEntryById, getProductInstanceById, weakMapCreateSelector } from '@wcp/wario-ux-shared';

import {
  GridColDef, GridDetailPanelToggleCell, GridValueGetterParams, GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
  GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
  DataGridPremium,
  GridRowGroupingModel,
  useKeepGroupedColumnsHidden,
  useGridApiRef,
  GRID_TREE_DATA_GROUPING_FIELD
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
type RowType = { id: string; }
interface WMenuDisplayProps { categoryId: string; };
interface DGEmbeddedMetadata { size: number; ordinal: number; key: string };
const DataGridMetadataPrefix = /DG_(S(?<size>\d)_)?(O(?<ordinal>-?\d)_)?(?<name>.*)/;
// interface IProductInstanceForMenu {
//   id: string;
//   categories: string[];
//   category: string;
//   subcategoryI?: string;
//   subcategoryII?: string;
//   subcategoryIII?: string;
//   name: string;
//   price: string;
//   metadata: { [index: string]: string; };
// }
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
      console.log( { ext: pi.externalIDs})
      return (pi.externalIDs.find(ext => ext.key === "Categories")?.value ?? "").split(',') 
    },
    name: (s: RootState, productInstanceId: string) => SelectProductMetadataForMenu(s, productInstanceId).name,
    price: (s: RootState, productInstanceId: string) => MoneyToDisplayString(SelectProductMetadataForMenu(s, productInstanceId).price, false),
    metadata: (s: RootState, productInstanceId: string) => getProductInstanceById(s.ws.productInstances, productInstanceId)!.externalIDs.reduce((acc, kv)=> kv.value.length ? {...acc, [kv.key]: kv.value } : acc ,{})
  },
  weakMapCreateSelector
);

const ProductName = (params: GridRenderCellParams<RowType>) => {
  const displayString = useAppSelector(s => SelectProductInstanceForMenu(s, params.row.id).name);
  return <>{displayString}</>;
}
const ProductPrice = (params: GridRenderCellParams<RowType>) => {
  const displayString = useAppSelector(s => SelectProductInstanceForMenu(s, params.row.id).price);
  return <>{displayString}</>;
}

const ProductCategories = (params: GridRenderCellParams<RowType>) => {
  const cats = useAppSelector(s => SelectProductInstanceForMenu(s, params.row.id).categories);
  const metadata = useAppSelector(s => SelectProductInstanceForMenu(s, params.row.id).metadata);
  console.log({metadata});
  return <>{cats.length > 0 ? cats[0] : ""}</>;
}

const ProductCategories1 = (params: GridRenderCellParams<RowType>) => {
  const cats = useAppSelector(s => SelectProductInstanceForMenu(s, params.row.id).categories);
  return <>{cats.length > 1 ? cats[1] : ""}</>;
}
const ProductCategories2 = (params: GridRenderCellParams<RowType>) => {
  const cats = useAppSelector(s => SelectProductInstanceForMenu(s, params.row.id).categories);
  return <>{cats.length > 2 ? cats[2] : ""}</>;
}
const ProductCategories3 = (params: GridRenderCellParams<RowType>) => {
  const cats = useAppSelector(s => SelectProductInstanceForMenu(s, params.row.id).categories);
  return <>{cats.length > 3 ? cats[3] : ""}</>;
}

export function WMenuDataGrid({ categoryId }: WMenuDisplayProps) {
  const SelectCategoryListForProductInstanceId = useAppSelector(s=>(productInstanceId: string) => SelectProductInstanceForMenu(s, productInstanceId).categories);
  const [rowGroupingModel, setRowGroupingModel] =
    React.useState<GridRowGroupingModel>(['category', 'subcategoryI', 'subcategoryII']);
  const apiRef = useGridApiRef();

  const initialState = ({
      apiRef,
      initialState: {
        pinnedColumns: {
          left: [GRID_TREE_DATA_GROUPING_FIELD],
        },
      },
    });
  const productRows = useAppSelector(s=>SelectProductInstanceIdsInCategoryForNextAvailableTime(s, categoryId, 'Menu'));
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
  //   //{ headerName: "Ordinal", field: "ordinal", valueGetter: (v: ValueGetterRow) => v.row.category.ordinal, flex: 3 },

  //   return Object.entries(acc).map((entry) => ({ flex: entry[1].size, headerName: entry[0], field: entry[0], valueGetter: (v: IProductInstanceValueGetter) => v.row.id ?? "" }));
  // }, [productRows]);
  // const categorizedProducts = useMemo(() => productRows.reduce((acc: HierarchicalProductStructure, curr: IProductInstance) =>
  // GenerateHierarchicalProductStructure(acc, curr, 0), { category: "", products: [], subcategories: {} } as HierarchicalProductStructure), [productRows]);
  // const isTreeDataGrid = useMemo(() => {

  // }, [])
  // const massagedProduct = useMemo(() => productRows.map(x=> {
  //   const pi = productInstanceSelector(x);
  //   return ConvertProductToMenuProduct(pi, productEntrySelector);
  // }), [productRows, productEntrySelector, productInstanceSelector]);
  // console.log({ massagedProduct });
  return (
    <DataGridPremium
      apiRef={apiRef}
      treeData
      // defaultGroupingExpansionDepth={1}
      getTreeDataPath={(row) => SelectCategoryListForProductInstanceId(row.id) }
      // groupingColDef={{ leafField: 'Category' }}

      density="compact"
      // componentsProps={{
      //   toolbar: {
      //     showQuickFilter: true,
      //     quickFilterProps: { debounceMs: 500 },
      //   },
      // }}
      // components={ {
      //   Toolbar: CustomToolbar }
      // }
      // rowGroupingModel={rowGroupingModel}
      // onRowGroupingModelChange={(model) => setRowGroupingModel(model)}
      // initialState={initialState}
      // initialState={{
      //   sorting: {
      //     sortModel: [{ field: 'category', sort: 'desc' }, { field: 'subcategoryI', sort: 'desc'}, { field: 'subcategoryII', sort: 'desc'}, { field: 'name', sort: 'desc'} ],
      //   },
      // }}
      autoHeight
      disableRowSelectionOnClick
      disableMultipleRowSelection
      disableColumnReorder
      // getRowId={(row) => row.id}
      columns={[
        { headerName: "Category", field: "category", renderCell: (params: GridRenderCellParams<RowType>) => <ProductCategories {...params} /> },
        // { headerName: "SubCategory I", field: "subcategoryI", renderCell: (params: GridRenderCellParams<RowType>) => <ProductCategories1 {...params} />, flex: 1.5 },
        // { headerName: "SubCategory II", field: "subcategoryII", renderCell: (params: GridRenderCellParams<RowType>) => <ProductCategories2 {...params} />, flex: 2 },
        { headerName: "Name", field: "name",  renderCell: (params) => <ProductName {...params} />, flex: 5 },
        //...dynamicColumns,
        { headerName: "Price", field: "price", renderCell: (params) => <ProductPrice {...params} />, flex: 1 }
      ]}
      rows={productRows.map((x) => ({ id: x}))}
    />
  );
}
