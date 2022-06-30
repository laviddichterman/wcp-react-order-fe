import { useFormContext, Controller } from 'react-hook-form';
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';
import { Key } from 'react';

// ----------------------------------------------------------------------
export function RHFCheckbox({ name, label, ...other } : {name: string, label: React.ReactNode, [x:string]: any}) {
  const { control } = useFormContext();

  return (
    <FormControlLabel
      control={
        <Controller
          name={name}
          control={control}
          defaultValue={''}
          render={({ field }) => <Checkbox {...field} checked={field.value === true} />}
        />
      }
      label={label}
      {...other}
    />
  );
}

// ----------------------------------------------------------------------
export function RHFMultiCheckbox({ name, options, ...other } : {name: string, options: {value: Key, label: React.ReactNode}[], [x:string]: any}) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const onSelected = (option : Key) =>
          field.value.includes(option) ? field.value.filter((value: any) => value !== option) : [...field.value, option];

        return (
          <FormGroup>
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={field.value.includes(option.value)}
                    onChange={() => field.onChange(onSelected(option.value))}
                  />
                }
                label={option.label}
                {...other}
              />
            ))}
          </FormGroup>
        );
      }}
    />
  );
}
