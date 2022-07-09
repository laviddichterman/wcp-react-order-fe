import PhoneInput, { Country } from 'react-phone-number-input/react-hook-form-input-core'
import { TextField } from '@mui/material';
import { useFormContext } from 'react-hook-form';
import { LIBPHONE_METADATA } from '../common';
import React from 'react';
interface IPhoneInputParams {
  name: string;
  country: Country;
  label: React.ReactNode;
  placeholder: string;
  [x: string]: any;
};


export function RHFPhoneInput({ placeholder, label, country, name, ...other }: IPhoneInputParams) {
  const { control } = useFormContext();
  return (
    <PhoneInput smartCaret control={control} name={name} label={label} metadata={LIBPHONE_METADATA} country={country} placeholder={placeholder}
      inputComponent={React.forwardRef((props : any, ref) => {
        const {error } = props;
      return <TextField 
        inputRef={ref} 
        error={!!error}
        helperText={error?.message} 
        {...other} 
        {...props} />})
      } />
  );
}



/*
export function RHFPhoneInput({ placeholder, label, country, name, ...other }: IPhoneInputParams) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <PhoneInput
          label={label}
          metadata={LIBPHONE_METADATA}
          country={country}
          {...other}
          placeholder={placeholder}
          inputComponent={React.forwardRef((props, ref) =>
            <TextField
              {...field}
              inputRef={ref}
              error={!!error}
              helperText={error?.message}
              
              {...props} />)}
        />))}

  );
}
*/
