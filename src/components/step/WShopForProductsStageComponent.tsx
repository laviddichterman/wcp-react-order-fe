import React, { useState, useEffect, useCallback } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import { ExpandMore } from "@mui/icons-material";
import { PIZZAS_CATID, EXTRAS_CATID } from '../../config';
import { CartEntry, OrderFulfillment } from '../common';
import { WProductComponent } from '../WProductComponent';
import { WOrderCart } from '../WOrderCartComponent';
const wcpshared = require('@wcp/wcpshared');


const FilterEmptyCategories = function (menu: any, order_time: Date) {
  return wcpshared.FilterEmptyCategories(menu, function (x: any) { return x.order.hide; }, order_time);
};

// NOTE: any calls to this are going to need the order_time properly piped because right now it's just getting the fulfillment.dt.day
const FilterProduct = function (menu: any, order_time: Date) {
  return function (item: any) { return wcpshared.FilterProduct(item, menu, function (x: any) { return x.order.hide; }, order_time); };
};

const ComputeExtrasCategories = (menu: any, time: Date): string[] => {
  return menu.categories[EXTRAS_CATID].children.length ? menu.categories[EXTRAS_CATID].children.filter(FilterEmptyCategories(menu, time)) : []
}

interface IShopForProductsStage {
  menu: any;
  fulfillment: OrderFulfillment;
}

export function WShopForProductsStage({ menu, fulfillment }: IShopForProductsStage) {
  const [ linearCart, setLinearCart ] = useState<CartEntry[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [activePanel, setActivePanel] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);
  const [extrasCategories, setExtrasCategories] = useState<string[]>([]);
  const [selection, setSelection] = useState(null);

  const ProductsForCategoryFilteredAndSorted = useCallback((category: string) => menu.categories[category].menu.filter(FilterProduct(menu, fulfillment.dt.day)).sort((p: any) => p.display_flags.order.ordinal), [menu.categories, fulfillment]);

  // reinitialize the accordion if the expanded s still in range 
  useEffect(() => {
    const extras = ComputeExtrasCategories(menu, fulfillment.dt.day);
    if (extras.length !== extrasCategories.length) {
      setActivePanel(0);
      setExtrasCategories(extras);
      setInitialized(true);
    }
  }, [menu, setInitialized]);

  const toggleAccordion = (i: number) => {
    if (activePanel === i) {
      setIsExpanded(!isExpanded);
    }
    else {
      setActivePanel(i);
      setIsExpanded(true);
    }
  }

  return (
    <div>
      <div className="ordering-menu menu-list menu-list__dotted" ng-show="orderCtrl.s.stage === 2 && !pmenuCtrl.selection">
        <h3 className="flush--top" ng-if="orderCtrl.s.num_pizza === 0"><strong>Click a pizza below to get started</strong></h3>
        <h3 className="flush--top" ng-if="orderCtrl.s.num_pizza > 0"><strong>Click a pizza below or next to continue</strong></h3>
        <ul className="flexitems menu-list__items">
          {ProductsForCategoryFilteredAndSorted(PIZZAS_CATID).map((p: any, i: number) =>
            <li className="flexitem menu-list__item" ng-repeat="pizza in pmenuCtrl.CONFIG.MENU.categories[pmenuCtrl.CONFIG.PIZZAS_CATID].menu | filter:orderCtrl.FilterProducts(pmenuCtrl.CONFIG.MENU) | orderBy:'display_flags.order.ordinal'">
              <div className="offer-link" ng-click="orderCtrl.ScrollTop(); orderCtrl.SelectProduct(pmenuCtrl.CONFIG.PIZZAS_CATID, pizza, pmenuCtrl)">
                <WProductComponent product={p} allowadornment description dots price menu={menu} displayContext="order" />
              </div>
            </li>)}
        </ul>
      </div>
      <div ng-show="orderCtrl.s.stage === 3 && !pmenuCtrl.selection">
        <h3 className="flush--top"><strong>Add small plates or beverages to your order.</strong></h3>
        {extrasCategories.map((subcatid: string, i: number) =>
          <Accordion key={i} expanded={activePanel === i && isExpanded} onChange={() => toggleAccordion(i)} className="ordering-menu menu-list menu-list__dotted" >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography sx={{ ml: 4 }}><span dangerouslySetInnerHTML={{ __html: menu.categories[subcatid].menu_name }} /></Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ul className="menu-list__items">
                {menu.categories[subcatid].subtitle ? <li className="menu-list__item"><strong><span dangerouslySetInnerHTML={{ __html: menu.categories[subcatid].subtitle }}></span></strong></li> : ""}
                {ProductsForCategoryFilteredAndSorted(subcatid).map((p: any, j: number) =>
                  <li className="menu-list__item">
                    <div className="offer-link" ng-click="orderCtrl.SelectProduct(subcatid, extra, pmenuCtrl)">
                      <WProductComponent product={p} allowadornment description dots price menu={menu} displayContext="order" />
                    </div>
                  </li>)}
              </ul>
            </AccordionDetails>
          </Accordion>)}
      </div >

      <WOrderCart isProductEditDialogOpen menu={menu} linearCart={linearCart} />

      <div className="order-nav" ng-hide="pmenuCtrl.selection">
        <h5 className="order-nav-item float--right" ng-if="orderCtrl.s.num_pizza === 0 && orderCtrl.s.stage === 1">First, click on an item above to add it to your order</h5>
        <button type="submit" className="btn" ng-show="orderCtrl.HasPreviousStage()" ng-click="orderCtrl.ScrollTop(); orderCtrl.PreviousStage()">Previous</button>
        <button type="submit" className="btn" ng-disabled="orderCtrl.s.num_pizza === 0" ng-show="orderCtrl.HasNextStage() && orderCtrl.s.num_pizza >= 1" ng-click="orderCtrl.ScrollTop(); pmenuCtrl.UnsetProduct(); orderCtrl.NextStage()">Next</button>
      </div>
    </div>
  )
}



