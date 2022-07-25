import React, { useCallback, useState } from 'react';
import {InputBaseComponentProps, TextField, TextFieldProps} from '@mui/material';

export interface ICheckFxnGen<T> {
  inputProps: {
    min?: number;
    max?: number;

  } & Partial<InputBaseComponentProps>;
  parseFunction: (v: string | null | undefined) => number;
  allowEmpty: T;
}
function CheckFunctionGenerator<T extends boolean>({ inputProps, parseFunction, allowEmpty}: ICheckFxnGen<T>) {
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

export type ICheckedNumericInput<T> = ICheckFxnGen<T> & CheckedNumericInputProps & Omit<TextFieldProps, 'value' | 'onChange' | 'inputProps' | 'onBlur'>;

export function CheckedNumericInput<T extends boolean>({ onChange, value, inputProps, allowEmpty, parseFunction = parseInt, ...other } : ICheckedNumericInput<T>) {
  const CheckFxn = useCallback((v : string | null) => CheckFunctionGenerator<T>({inputProps, parseFunction, allowEmpty})(v), [inputProps, parseFunction]);
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


// import React, { useCallback, useState } from 'react';
// import {InputBaseComponentProps, TextField, TextFieldProps} from '@mui/material';

// type MinMax = { min: number; max: number; };
// type ParseFxnEmptyT = (v: string | null) => number | null;
// type ParseFxnEmptyF = (v: string | null) => number;
// type InputPropsEmptyT = Partial<MinMax> & Omit<InputBaseComponentProps, 'min' | 'max'>;
// type InputPropsEmptyF = MinMax & Omit<InputBaseComponentProps, 'min' | 'max'>;
// type ChkFxnAllowEmptyFalse = { inputProps: InputPropsEmptyF  } & { parseFunction: ParseFxnEmptyF; allowEmpty: false; };
// type ChkFxnAllowEmptyTrue = { inputProps: InputPropsEmptyT } & { parseFunction: ParseFxnEmptyT; allowEmpty: true; };

// export interface ICheckFxnGen<T extends boolean> {
//   inputProps: InputPropsEmptyT | InputPropsEmptyF;
//   parseFunction: ParseFxnEmptyT | ParseFxnEmptyF;
//   allowEmpty: T;
// }

// function CheckFunctionGenerator({ inputProps, parseFunction, allowEmpty}: (ChkFxnAllowEmptyFalse | ChkFxnAllowEmptyTrue)) {
//   const MIN = inputProps.min !== undefined && Number.isFinite(inputProps.min) ? inputProps.min : null;
//   const MAX = inputProps.max !== undefined && Number.isFinite(inputProps.max) ? inputProps.max : null;
//   return (e: string | null) => {
//     const parsed = parseFunction(e);
//     if (Number.isNaN(parsed) || parsed === null) {
//       if (!allowEmpty && MIN !== null) {
//         return MIN;
//       }
//       return null;
//     }
//     if (MIN !== null && parsed < MIN) {
//       return MIN;
//     }
//     if (MAX !== null && parsed > MAX) {
//       return MAX;
//     }
//     return parsed;
//   }
// }

// type TFProps = Omit<TextFieldProps, 'value' | 'onChange' | 'inputProps' | 'onBlur'>;
// type ValuePropEmptyT = { onChange: (value : number | null) => void; value: number | null; }
// type ValuePropEmptyF = { onChange: (value : number) => void; value: number; }
// type CheckedNumericInputProps = ((ICheckFxnGen<false> & ValuePropEmptyF) | (ICheckFxnGen<true> & ValuePropEmptyT)) & TFProps;


// export type ICheckedNumericInput = ICheckFxnGen<true> & CheckedNumericInputProps & Omit<TextFieldProps, 'value' | 'onChange' | 'inputProps' | 'onBlur'>;

// export function CheckedNumericInput({ onChange, value, inputProps, allowEmpty, parseFunction = parseInt, ...other } : CheckedNumericInputProps) {
//   const CheckFxn = useCallback((v : string | null) => CheckFunctionGenerator({inputProps, parseFunction, allowEmpty})(v), [inputProps, parseFunction]);
//   const [local_value, setLocalValue] = useState(value !== null ? String(value) : null);
//   const [dirty, setDirty] = useState(false);
//   const onFinishChangingLocal = () => {
//     const new_val = CheckFxn(local_value);
//     setDirty(false);
//     setLocalValue(new_val !== null ? String(new_val) : null);
//     onChange(new_val);
//   }

//   const onChangeLocal = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setDirty(true);
//     setLocalValue(event.target.value);
//   }

//   return (
//     <TextField
//       {...other}
//       value={dirty ? local_value : value}
//       // helperText={dirty && local_value != value ? "Modified" : ""}
//       inputProps={inputProps}
//       onChange={onChangeLocal}
//       onBlur={onFinishChangingLocal}
//     />
//   )
// }
