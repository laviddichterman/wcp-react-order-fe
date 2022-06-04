import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';
import { ExpandMore } from "@mui/icons-material";
import { PIZZAS_CATID, EXTRAS_CATID } from '../config';
import { CartEntry, OrderFulfillment } from './common';
import { WProductComponent } from './WProductComponent';
import { WOrderCart } from './WOrderCartComponent';
const wcpshared = require('@wcp/wcpshared');

const MODDISP_RADIO = 0;
const MODDISP_TOGGLE = 1;
const MODDISP_CHECKBOX = 2;

const enum MODIFIER_DISPLAY { RADIO, TOGGLE, CHECKBOX };

interface IModifierOptionCustomizerComponent {
  option: any;
  allowAdvanced: boolean;
  displayType: MODIFIER_DISPLAY;
}

function WModifierOptionRadio({option}) {

}

export function WModifierOptionCustomizerComponent({option, allowAdvanced, displayType} : IModifierOptionCustomizerComponent) {
  this.GetEnableState = function () {
    // reference to the modifier map info for this particular option, READ ONLY
    return this.modctrl.pmenuctrl.selection.modifier_map[this.modctrl.mtid].options[this.option.moid];
  }

  this.AdvancedOptionEligible = function () {
    var enable_state = this.GetEnableState();
    // TODO: likely need to remove the this.placement !== TOPPING_NONE check since it won't allow a half topping to be added if there's still room on one side
    // flag indicating there is an advanced option that could be selected, and we should show the button to access that
    return this.allowadvanced && this.modctrl.display_type === MODDISP_CHECKBOX && (enable_state.enable_left || enable_state.enable_right) && this.placement !== TOPPING_NONE;
  }

  this.Initialize = function () {
    this.MENU = this.config.MENU;
    var placement = GetPlacementFromMIDOID(this.selection, this.option.modifier._id, this.option.moid);
    this.placement = placement;
    this.advanced_option_selected = placement === TOPPING_LEFT || placement === TOPPING_RIGHT;
    this.left = placement === TOPPING_LEFT;
    this.right = placement === TOPPING_RIGHT;
    this.whole = placement === TOPPING_WHOLE;
  };

  this.UpdateOption = function (new_placement, is_from_advanced_modal) {
    this.modctrl.PostModifyCallback(this.option.moid, new_placement, is_from_advanced_modal);
    this.placement = new_placement;
    this.advanced_option_selected = new_placement === TOPPING_LEFT || new_placement === TOPPING_RIGHT;
  };

  this.WholePostProcess = function (is_from_advanced_modal) {
    this.left = this.right = false;
    var new_placement = (+this.right * TOPPING_RIGHT) + (+this.left * TOPPING_LEFT) + (+this.whole * TOPPING_WHOLE);
    this.UpdateOption(new_placement, is_from_advanced_modal);
  };

  this.LeftPostProcess = function(is_from_advanced_modal) {
    this.right = this.whole = false;
    this.UpdateOption((+this.left * TOPPING_LEFT), is_from_advanced_modal);
  }
  this.RightPostProcess = function(is_from_advanced_modal) {
    this.left = this.whole = false;
    this.UpdateOption((+this.right * TOPPING_RIGHT), is_from_advanced_modal);
  }

  this.Initialize();
  return (<>
    <input ng-if="ctrl.modctrl.display_type === 0" type="radio" id="{{ctrl.option.shortname}}_whole" className="input-whole" ng-model="ctrl.modctrl.current_single_value" ng-value="ctrl.option.moid" ng-disabled="!ctrl.GetEnableState().enable_whole" ng-change="ctrl.UpdateOption(ctrl.config.WHOLE, false)" />
  <input ng-if="ctrl.modctrl.display_type === 2" id="{{ctrl.option.shortname}}_whole" className="input-whole" ng-model="ctrl.whole" ng-disabled="!ctrl.GetEnableState().enable_whole" type="checkbox" ng-change="ctrl.WholePostProcess(false)" />
    <input ng-if="ctrl.modctrl.display_type === 2" ng-show="ctrl.left || (!ctrl.GetEnableState().enable_whole && ctrl.GetEnableState().enable_left)" id="{{ctrl.option.shortname}}_left" className="input-left" ng-model="ctrl.left" ng-disabled="!ctrl.GetEnableState().enable_left" type="checkbox" ng-change="ctrl.LeftPostProcess(false)" />
    <input ng-if="ctrl.modctrl.display_type === 2" ng-show="ctrl.right || (!ctrl.GetEnableState().enable_whole && ctrl.GetEnableState().enable_right)" id="{{ctrl.option.shortname}}_right" className="input-right" ng-model="ctrl.right" ng-disabled="!ctrl.GetEnableState().enable_right" type="checkbox" ng-change="ctrl.RightPostProcess(false)" />
    <span className="option-circle-container">
    <label ng-show="!ctrl.advanced_option_selected" for="{{ctrl.option.shortname}}_whole" className="option-whole option-circle" />
    <label ng-if="ctrl.modctrl.display_type === 2" ng-show="ctrl.left || (!ctrl.GetEnableState().enable_whole && ctrl.GetEnableState().enable_left)" for="{{ctrl.option.shortname}}_left" className="option-left option-circle" />
    <label ng-if="ctrl.modctrl.display_type === 2" ng-show="ctrl.right || (!ctrl.GetEnableState().enable_whole && ctrl.GetEnableState().enable_right)" for="{{ctrl.option.shortname}}_right" className="option-right option-circle" />
    </span>
    <label className="topping_text" for="{{ctrl.option.shortname}}_whole" ng-disabled="!ctrl.GetEnableState().enable_whole">{{ctrl.option.name}}</label>
    <button name="edit" ng-if="ctrl.AdvancedOptionEligible()" ng-click="ctrl.modctrl.pmenuctrl.SetAdvancedOption($event, ctrl)" className="button-sml"><div className="icon-gear"></div></button>
    </>);
};



interface IModifierTypeCustomizerComponent {
  menu: any;
  mtid: string;
  allowAdvanced: boolean;
}
export function WModifierTypeCustomizerComponent({menu, mtid, allowAdvanced} : IModifierOptionCustomizerComponent) {
  const displayedOptions = useMemo(() => ([]), [menu, mtid]);
  const displayName = useMemo(() => menu.modifiers[mtid].modifier_type.display_name ? menu.modifiers[mtid].modifier_type.display_name : menu.modifiers[mtid].modifier_type.name, [menu, mtid]);
  return (
    <>
    <div>{displayName}:</div>
    <div className="modifier flexitems">
      { displayedOptions.map((option:any, i: number) => 
      <div className="flexitem" key={i}>
        <WModifierOptionCustomizerComponent option={option} allowAdvanced={} />
      </div>)}
      <div ng-if="ctrl.display_type !== 1" className="flexitem" ng-repeat="option in ctrl.visible_options" wcpoptiondir
        selection="ctrl.selection" modctrl="ctrl" option="option" config="ctrl.config" allowadvanced="ctrl.pmenuctrl.allow_advanced">
      </div>
      <div className="flexitem" ng-if="ctrl.display_type === 1">
        <input type="checkbox" id="{{ctrl.toggle_values[1].shortname}}_whole" className="input-whole"
          ng-disabled="!ctrl.pmenuctrl.selection.modifier_map[ctrl.mtid].options[ctrl.toggle_values[1].moid].enable_whole"
          ng-model="ctrl.current_single_value" ng-true-value="1"
          ng-false-value="0" ng-change="ctrl.PostModifyCallback(0, 0, false)" />
        <span className="option-circle-container">
          <label htmlFor={`${ctrl.toggle_values[1].shortname}_whole`} className="option-whole option-circle"></label>
        </span>
        <label className="topping_text" htmlFor="{{ctrl.toggle_values[1].shortname}}_whole">{ctrl.toggle_values[1].name}</label>
      </div>
    </div>
    </>
  );
}

app.directive("wcpmodifierdir", function () {
  return {
    restrict: "A",
    scope: {
      mtid: "=mtid",
      selection: "=selection",
      config: "=config",
      allowsplit: "=allowsplit",
      pmenuctrl: "=pmenuctrl",
      //servicetime: "=servicetime"
    },
    controllerAs: "ctrl",
    bindToController: true,
    controller: function () {
      this.Initialize = function () {
        // todo: deal with servicetime
        var service_time = moment();//this.servicetime;
        var menu = this.config.MENU;
        var modmap = this.pmenuctrl.selection.modifier_map;
        var mtid = this.mtid;
        // determine list of visible options
        var filtered_options = menu.modifiers[this.mtid].options_list.filter(function (x) {
          return DisableDataCheck(x.disable_data, service_time);
        })
        if (menu.modifiers[this.mtid].modifier_type.display_flags.omit_options_if_not_available) {
          var filterfxn = function (x) {
            var modmap_entry = modmap[mtid].options[x.moid];
            return modmap_entry.enable_left || modmap_entry.enable_right || modmap_entry.enable_whole;
          };
          filtered_options = filtered_options.filter(filterfxn);
        }
        this.visible_options = filtered_options;

        // determines display type
        // determines product base if this is a toggle style modifier
        if (menu.modifiers[this.mtid].modifier_type.max_selected === 1) {
          if (menu.modifiers[this.mtid].modifier_type.min_selected === 1) {
            if (menu.modifiers[this.mtid].modifier_type.display_flags && menu.modifiers[this.mtid].modifier_type.display_flags.use_toggle_if_only_two_options &&
              this.visible_options.length === 2) {
              var BASE_PRODUCT_INSTANCE = menu.product_classes[this.selection.PRODUCT_CLASS._id].instances_list.find(function (prod) { return prod.is_base === true; });
              console.assert(BASE_PRODUCT_INSTANCE, `Cannot find base product instance of ${JSON.stringify(this.selection)}.`);
              var base_moid = BASE_PRODUCT_INSTANCE.modifiers.hasOwnProperty(this.mtid) && BASE_PRODUCT_INSTANCE.modifiers[this.mtid].length === 1 ? BASE_PRODUCT_INSTANCE.modifiers[this.mtid][0][1] : "";
              var base_option = base_moid ? menu.modifiers[this.mtid].options[base_moid] : null;
              if (!base_option || !this.visible_options.some(function (x) { return x.moid == base_moid; })) {
                // the base product's option ${base_moid} isn't visible. switching to RADIO modifier display for ${this.mtid}`);
                this.display_type = MODDISP_RADIO;
              }
              else {
                this.display_type = MODDISP_TOGGLE;
                var toggle_on_option = this.visible_options.find(function(x) { return x.moid != base_moid; });
                console.assert(toggle_on_option, "should have found an option for the toggle!");
                this.toggle_values = [base_option, toggle_on_option];
              }
              // sets the current single value to the MOID of the current selection
              this.current_single_value = this.selection.modifiers.hasOwnProperty(this.mtid) && this.selection.modifiers[this.mtid].length === 1 ? this.selection.modifiers[this.mtid][0][1] : "";
            }
            else {
              this.display_type = MODDISP_RADIO;
              this.current_single_value = this.selection.modifiers.hasOwnProperty(this.mtid) && this.selection.modifiers[this.mtid].length === 1 ? this.selection.modifiers[this.mtid][0][1] : "";
            }
          }
          else { // if (menu.modifiers[this.mtid].modifier_type.min_selected === 0)
            // checkbox that kinda functions like a radio button
            this.display_type = MODDISP_CHECKBOX;
          }
        }
        else {
          this.display_type = MODDISP_CHECKBOX;
        }
      };

      this.PostModifyCallback = function (moid, placement, is_from_advanced_modal) { 
        //console.log(`placement ${placement} of option ${JSON.stringify(moid)}`);
        if (!this.pmenuctrl.selection.modifiers.hasOwnProperty(this.mtid)) {
          this.pmenuctrl.selection.modifiers[this.mtid] = [];
        }
        if (this.display_type === MODDISP_CHECKBOX) {
          if (placement === TOPPING_NONE) {
            this.pmenuctrl.selection.modifiers[this.mtid] = this.pmenuctrl.selection.modifiers[this.mtid].filter(function(x) { return x[1] != moid; });
          }
          else {
            if (this.config.MENU.modifiers[this.mtid].modifier_type.min_selected === 0 && 
              this.config.MENU.modifiers[this.mtid].modifier_type.max_selected === 1) {
              // checkbox that requires we unselect any other values since it kinda functions like a radio
              this.pmenuctrl.selection.modifiers[this.mtid] = [];
            }
            var moidx = this.pmenuctrl.selection.modifiers[this.mtid].findIndex(function(x) { return x[1] == moid; });
            if (moidx === -1) {
              this.pmenuctrl.selection.modifiers[this.mtid].push([placement, moid]);
            }
            else {
              this.pmenuctrl.selection.modifiers[this.mtid][moidx][0] = placement;
            }
          }
        }
        else { // display_type === MODDISP_TOGGLE || display_type === MODDISP_RADIO
          if (this.display_type === MODDISP_TOGGLE) {
            this.pmenuctrl.selection.modifiers[this.mtid] = [[TOPPING_WHOLE, this.toggle_values[this.current_single_value].moid]];
          }
          else {
            this.pmenuctrl.selection.modifiers[this.mtid] = [[TOPPING_WHOLE, this.current_single_value]];
          }
        }
        this.pmenuctrl.PostModifierChangeCallback(is_from_advanced_modal);
      };
      this.Initialize();
    }
  }
});


app.directive("wcpoptiondetailmodaldir", function () {
return {
  restrict: "A",
  scope: {
    optionctrl: "=optionctrl",
  },
  controller: function () {
  },
  controllerAs: 'ctrl',
  bindToController: true,
  template: '<md-dialog-content className="option-modal"><h2 className="option-modal-title">{{ctrl.optionctrl.option.name}} options</h2>\
      <div layout="row" layout-align="center center">\
      <div>Placement:</div><div></div>\
      <div><input id="{{ctrl.optionctrl.option.shortname}}_modal_whole" className="input-whole" ng-model="ctrl.optionctrl.whole" ng-disabled="!ctrl.optionctrl.GetEnableState().enable_whole" type="checkbox" ng-change="ctrl.optionctrl.WholePostProcess(true)"> \
      <input id="{{ctrl.optionctrl.option.shortname}}_modal_left" className="input-left" ng-model="ctrl.optionctrl.left" ng-disabled="!ctrl.optionctrl.GetEnableState().enable_left" type="checkbox" ng-change="ctrl.optionctrl.LeftPostProcess(true)"> \
      <input id="{{ctrl.optionctrl.option.shortname}}_modal_right" className="input-right" ng-model="ctrl.optionctrl.right" ng-disabled="!ctrl.optionctrl.GetEnableState().enable_right" type="checkbox" ng-change="ctrl.optionctrl.RightPostProcess(true)"> \
      <span className="option-circle-container"> \
        <label for="{{ctrl.optionctrl.option.shortname}}_modal_left" className="option-left option-circle"></label> \
      </span>\
      <span className="option-circle-container"> \
        <label for="{{ctrl.optionctrl.option.shortname}}_modal_whole" className="option-whole option-circle"></label> \
      </span>\
      <span className="option-circle-container"> \
        <label for="{{ctrl.optionctrl.option.shortname}}_modal_right" className="option-right option-circle"></label> \
      </span></div> \
      </div></md-dialog-content>\
      <md-dialog-actions>\
        <button name="cancel" className="btn" ng-click="ctrl.optionctrl.modctrl.pmenuctrl.CancelAdvancedOptionModal()">Cancel</button>\
        <span className="flex" flex></span>\
        <button className="btn" name="confirm" ng-click="ctrl.optionctrl.modctrl.pmenuctrl.ConfirmAdvancedOptionModal()">Confirm</button>\
      </md-dialog-actions>' 
};
});

interface IProductCustomizerComponent {
  menu: any;
  fulfillment: OrderFulfillment;

}
export function WProductCustomizerComponent() {
  return (
    <div className="customizer menu-list__items" ng-if="pmenuCtrl.selection">
      <div style="visibility: hidden">
        <div className="md-dialog-container customizer" id="wcpoptionmodal">
          <md-dialog wcpoptiondetailmodaldir optionctrl="pmenuCtrl.advanced_option"></md-dialog>
        </div>
      </div>
      <h3 className="flush--top"><strong>Customize {pmenuCtrl.selection.PRODUCT_CLASS.display_flags && pmenuCtrl.selection.PRODUCT_CLASS.display_flags.singular_noun ? "your " + pmenuCtrl.selection.PRODUCT_CLASS.display_flags.singular_noun : "it"}!</strong></h3>
      <div className="menu-list__item">
        <wcppizzacartitem prod="pmenuCtrl.selection" description="true" dots="true" price="true" menu="pmenuCtrl.CONFIG.MENU" displayctx="order"></wcppizzacartitem>
      </div>
      <hr className="separator">
        <div wcpmodifierdir ng-repeat="(mtid, value) in pmenuCtrl.FilterModifiers(pmenuCtrl.selection.modifier_map)" mtid="mtid" selection="pmenuCtrl.selection" pmenuctrl="pmenuCtrl" config="orderCtrl.CONFIG">
        </div>
        <div ng-if="!pmenuCtrl.suppress_guide && pmenuCtrl.messages.length">
          <div className="wpcf7-response-output wpcf7-validation-errors" ng-repeat="msg in pmenuCtrl.messages">{{ msg }}</div>
        </div>
        <div ng-if="pmenuCtrl.errors.length">
          <div className="wpcf7-response-output" ng-repeat="msg in pmenuCtrl.errors">{{ msg }}</div>
        </div>
        <div ng-if="orderCtrl.s.enable_split_toppings && pmenuCtrl.selection.advanced_option_eligible"><label><input ng-disabled="pmenuCtrl.selection.advanced_option_selected" type="checkbox" ng-model="pmenuCtrl.allow_advanced">
          I desperately need to order a split topping pizza and I know it's going to be a bad value and bake poorly.</label></div>
        <div className="order-nav">
          <span className="one-fifth">
            <button name="remove" className="btn button-remove" ng-click="orderCtrl.ScrollTop(); pmenuCtrl.UnsetProduct()">Cancel</button>
          </span>
          <span className="four-fifths">
            <span className="order-nav-item float--right">
              <button ng-disabled="pmenuCtrl.errors.length || pmenuCtrl.selection.incomplete" ng-if="pmenuCtrl.is_addition" name="add" className="btn" ng-click="orderCtrl.ScrollTop(); orderCtrl.AddToOrder(pmenuCtrl.catid, pmenuCtrl.selection); pmenuCtrl.UnsetProduct()">Add to order</button>
              <button ng-disabled="pmenuCtrl.errors.length || pmenuCtrl.selection.incomplete" ng-if="!pmenuCtrl.is_addition" name="save" className="btn" ng-click="orderCtrl.ScrollTop(); orderCtrl.UpdateOrderEntry(pmenuCtrl.cart_entry, pmenuCtrl.selection); pmenuCtrl.UnsetProduct()">Save Changes</button>
            </span>
          </span>
        </div>
    </div>
  )
}

