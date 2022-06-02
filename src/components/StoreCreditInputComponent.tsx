import { useMemo } from 'react';
import PropTypes, { InferProps } from "prop-types";
import {TextField } from '@mui/material';
const wcpshared = require('@wcp/wcpshared');

/* app.directive("jqmaskedstorecredit", function () {
    return {
    restrict: "A",
      require: "ngModel",
      link: function (scope, element, attrs, ctrl) {
    $j.mask.definitions['C'] = "[A-Z0-9]";
        $j(element).mask("***-**-***-CCCCCCCC");
      }
    };
  });
  */


export function StoreCreditInputComponent({...forwardParams}) {
  return <TextField
  {...forwardParams}
/>;
}

StoreCreditInputComponent.propTypes = {
};

