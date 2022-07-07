
import PhoneInput from 'react-phone-number-input/input-core'
import {Country}  from 'react-phone-number-input';
import { TextField } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import metadata from '../../metadata.custom.json';

interface IPhoneInputParams { 
  name: string;
  country: Country;
  label: React.ReactNode;
  placeholder: string;
  [x: string]: any;
};

export function RHFPhoneInput({ placeholder, label, country, name, ...other } : IPhoneInputParams ) {
  const { control } = useFormContext();

  return (
    <PhoneInput metadata={metadata} country={country} placeholder={placeholder} inputComponent={
      <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField {...field} placeholder={placeholder} fullWidth label={label} error={!!error} helperText={error?.message} {...other} />
      )} />
    } />
  );
}

