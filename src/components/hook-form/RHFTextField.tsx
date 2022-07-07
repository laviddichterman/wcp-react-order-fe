// form
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { TextField } from '@mui/material';
import { StaticDatePicker } from '@mui/x-date-pickers';

// ----------------------------------------------------------------------
export function RHFTextField({ name, label, ...other }: { name: string, label: React.ReactNode, [x: string]: any }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField {...field} fullWidth label={label} error={!!error} helperText={error?.message} {...other} />
      )}
    />
  );
}

// ----------------------------------------------------------------------
export function RHFDatePicker({ name, label, format, placeholder, disabled, inputProps, ...other }: { name: string, label: React.ReactNode, disabled?: boolean, format: string, inputProps?: object, placeholder?: string, [x: string]: any }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null}
      render={({
        field: { onChange, value },
        fieldState: { error }
      }) =>
        {
          // console.log(error);
          // console.log(value);
          return <StaticDatePicker
          {...other}
          disabled={disabled}
          displayStaticWrapperAs="desktop"
          openTo="day"
          label={label}
          value={value || ""}
          inputFormat={format}
          onChange={(value) => onChange(value)}
          renderInput={(params) => (
            (
              <TextField
                
                {...params}
              />
            )
          )}
        />}
      }
    />
  );
}