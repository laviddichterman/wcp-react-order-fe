import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from "../../app/useHooks";
import { Typography, Grid } from '@mui/material';
import { IMenu, CategoryEntry, IProductInstance, MoneyToDisplayString, IMoney, IProduct } from '@wcp/wcpshared';
import { getProductEntryById } from '@wcp/wario-ux-shared';

import {
  GridColDef, GridDetailPanelToggleCell, GridValueGetterParams, GRID_DETAIL_PANEL_TOGGLE_COL_DEF,
  GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarQuickFilter,
  GridToolbarQuickFilterProps,
  DataGridPremium,
  GridRowGroupingModel,
  useKeepGroupedColumnsHidden,
  useGridApiRef
} from '@mui/x-data-grid-premium';

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

interface WMenuDisplayProps { menu: IMenu; category: CategoryEntry; };
interface DGEmbeddedMetadata { size: number; ordinal: number; key: string };
const DataGridMetadataPrefix = /DG_(S(?<size>\d)_)?(O(?<ordinal>-?\d)_)?(?<name>.*)/;
interface IProductInstanceForMenu {
  id: string;
  categories: string[];
  category: string;
  subcategoryI?: string;
  subcategoryII?: string;
  subcategoryIII?: string;
  name: string;
  price: string;
  metadata: { [index: string]: string; };
}
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

function ConvertProductToMenuProduct(pi: IProductInstance, productEntrySelector: (id: string) => {
  product: IProduct;
  instances: string[];
}): IProductInstanceForMenu {
  const cats = (pi.externalIDs.find(ext => ext.key === "Categories")?.value ?? "").split(',');
  return {
    id: pi.id,
    categories: (pi.externalIDs.find(ext => ext.key === "Categories")?.value ?? "").split(','),
    category: cats.length > 0 ? cats[0] : "",
    subcategoryI: cats.length > 1 ? cats[1] : undefined,
    subcategoryII: cats.length > 2 ? cats[2] : undefined,
    subcategoryIII: cats.length > 3 ? cats[3] : undefined,
    metadata: {},//pi.externalIDs.reduce((acc, kv)=> kv.value.length ? {...acc, [kv.value]: kv.value } : acc ,{}),
    name: pi.displayName,
    price: MoneyToDisplayString(productEntrySelector(pi.productId)!.product.price, false)
  }
}


type IProductInstanceValueGetter = GridValueGetterParams<IProductInstanceForMenu>;
export function WMenuDataGrid({ menu, category }: WMenuDisplayProps) {
  const [rowGroupingModel, setRowGroupingModel] =
    React.useState<GridRowGroupingModel>(['category', 'subcategoryI', 'subcategoryII']);
  const apiRef = useGridApiRef();

  const initialState = useKeepGroupedColumnsHidden({
      apiRef,
      initialState: {
        rowGrouping: {
          model: ['category', 'subcategoryI', 'subcategoryII'],
        },
        // sorting: {
        //   sortModel: [{ field: 'category', sort: 'desc' }, { field: 'subcategoryI', sort: 'desc'}, { field: 'subcategoryII', sort: 'desc'}, { field: 'name', sort: 'desc'} ],
        // },
      },
    });
  const productEntrySelector = useAppSelector(s => (id: string) => getProductEntryById(s.ws.products, id));
  const productRows = useMemo(() => [...category.menu, ...category.children.map(x => menu.categories[x].menu).flat()], [menu, category]);
  const dynamicColumns: GridColDef<IProductInstanceForMenu>[] = useMemo(() => {
    const acc: Record<string, DGEmbeddedMetadata> = {};
    productRows.forEach((pi) => pi.externalIDs.forEach(md => {
      if (md.value.length > 0) {
        const keyMatch = md.key.match(DataGridMetadataPrefix);
        if (keyMatch?.groups) {
          acc[keyMatch.groups.name] = { ordinal: Number.parseInt(keyMatch.groups.ordinal ?? "1"), size: Number.parseInt(keyMatch.groups.ordinal ?? "3"), key: md.key };
        }
      }
    }));
    //{ headerName: "Ordinal", field: "ordinal", valueGetter: (v: ValueGetterRow) => v.row.category.ordinal, flex: 3 },

    return Object.entries(acc).map((entry) => ({ flex: entry[1].size, headerName: entry[0], field: entry[0], valueGetter: (v: IProductInstanceValueGetter) => v.row.metadata[entry[0]] ?? "" }));
  }, [productRows]);
  // const categorizedProducts = useMemo(() => productRows.reduce((acc: HierarchicalProductStructure, curr: IProductInstance) =>
  // GenerateHierarchicalProductStructure(acc, curr, 0), { category: "", products: [], subcategories: {} } as HierarchicalProductStructure), [productRows]);
  // const isTreeDataGrid = useMemo(() => {

  // }, [])
  const massagedProduct = useMemo(() => productRows.map(x=>ConvertProductToMenuProduct(x, productEntrySelector)), [productRows, productEntrySelector]);
  // console.log({ massagedProduct });
  return (
    <DataGridPremium
      apiRef={apiRef}
      // treeData
      // defaultGroupingExpansionDepth={1}
      // getTreeDataPath={(row: IProductInstanceForMenu) => row.categories }
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
      initialState={initialState}
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
        { headerName: "Category", field: "category" },
        { headerName: "SubCategory I", field: "subcategoryI", flex: 1.5 },
        { headerName: "SubCategory II", field: "subcategoryII", flex: 2 },
        { headerName: "Name", field: "name", valueGetter: (v: IProductInstanceValueGetter) => v.row.name, flex: 5 },
        //...dynamicColumns,
        { headerName: "Price", field: "price", valueGetter: (v: IProductInstanceValueGetter) => v.row.price, flex: 1 }
      ]}
      rows={massagedProduct}
    />
  );
}
// return (
//   <Box>
//     {category.children.map((subSection) => {
//       const subCategory = menu.categories[subSection];
//       return (
//         <Box sx={{ pt: 4 }} key={subSection}>
//           <Typography variant="h4" sx={{ ml: 2 }} dangerouslySetInnerHTML={{ __html: subCategory.menu_name }} />
//           <Separator />
//           <WMenuRecursive menu={menu} category={subCategory} />
//         </Box>)
//     })}
//     <WMenuSection menu={menu} category={category} />
//   </Box>);
// }

