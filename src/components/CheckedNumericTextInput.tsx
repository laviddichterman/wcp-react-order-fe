import React, { useCallback, useState } from 'react';
import {InputBaseComponentProps, TextField, TextFieldProps} from '@mui/material';

export interface ICheckFxnGen {
  inputProps: {
    min?: number;
    max?: number;

  } & Partial<InputBaseComponentProps>;
  parseFunction: (v: string | null | undefined) => number;
  allowEmpty: boolean;
}
function CheckFunctionGenerator({ inputProps, parseFunction, allowEmpty }: ICheckFxnGen) {
  const MIN = inputProps.min !== undefined && Number.isFinite(inputProps.min) ? inputProps.min : null;
  const MAX = inputProps.max !== undefined && Number.isFinite(inputProps.max) ? inputProps.max : null;
  return (e: string | null) => {
    const parsed = parseFunction(e);
    if (Number.isNaN(parsed)) {
      if (!allowEmpty && MIN !== null) {
        return MIN;
      }
      return null;
    }
    if (MIN !== null && parsed < MIN) {
      return MIN;
    }
    if (MAX !== null && parsed > MAX) {
      return MAX;
    }
    return parsed;
  }
}

interface CheckedNumericInputProps {
  onChange: (value : number | null) => void;
  value: number | null;
}

export type ICheckedNumericInput = ICheckFxnGen & CheckedNumericInputProps & Omit<TextFieldProps, 'value' | 'onChange' | 'inputProps' | 'onBlur'>;

export function CheckedNumericInput({ onChange, value, inputProps, parseFunction = parseInt, allowEmpty = false, ...other } : ICheckedNumericInput) {
  const CheckFxn = useCallback((v : string | null) => CheckFunctionGenerator({inputProps, parseFunction, allowEmpty})(v), [allowEmpty, inputProps, parseFunction]);
  const [local_value, setLocalValue] = useState(value !== null ? String(value) : null);
  const [dirty, setDirty] = useState(false);
  const onFinishChangingLocal = () => {
    const new_val = CheckFxn(local_value);
    setDirty(false);
    setLocalValue(new_val !== null ? String(new_val) : null);
    onChange(new_val);
  }

  const onChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDirty(true);
    setLocalValue(event.target.value);
  }

  return (
    <TextField
      {...other}
      value={dirty ? local_value : value}
      // helperText={dirty && local_value != value ? "Modified" : ""}
      inputProps={inputProps}
      onChange={onChangeLocal}
      onBlur={onFinishChangingLocal}
    />
  )
}
