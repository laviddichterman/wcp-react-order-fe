import PhoneInput, { Country, } from 'react-phone-number-input/react-hook-form-input-core'
import { TextField, TextFieldProps } from '@mui/material';
import { FieldError, useFormContext } from 'react-hook-form';
import { LIBPHONE_METADATA } from '../common';
import React from 'react';
interface IPhoneInputParams {
  name: string;
  country: Country;
  error: FieldError | undefined;
  label: React.ReactNode;
  placeholder?: TextFieldProps['placeholder'];
  [x: string]: any;
};

export function RHFPhoneInput({ placeholder, error, label, country, name, ...other }: IPhoneInputParams & Omit<TextFieldProps, 'error' | 'name' | 'label'>) {
  const { control } = useFormContext();
  return (
    <PhoneInput smartCaret control={control} name={name} label={label} metadata={LIBPHONE_METADATA} country={country} placeholder={placeholder}
      inputComponent={React.forwardRef((props : any, ref) => {
      return <TextField 
        inputRef={ref} 
        error={!!error}
        helperText={error?.message ?? " "} 
        {...other} 
        {...props} />})
      } />
  );
}
