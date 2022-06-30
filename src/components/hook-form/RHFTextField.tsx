// form
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useState } from 'react';


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
  const [open, setOpen] = useState(false);
  return (
    <Controller
      name={name}
      control={control}
      defaultValue={null}
      render={({
        field: { onChange, value },
        fieldState: { error }
      }) => (
        <DatePicker
          {...other}
          disabled={disabled}
          open={open}
          onOpen={() => setOpen(disabled === undefined || !disabled)}
          onClose={() => setOpen(false)}
          label={label}
          value={value}
          inputFormat={format}
          onChange={(value) => onChange(value)}
          renderInput={(params) => (
            (
              <TextField
                error={error !== undefined}
                onClick={(e) => setOpen(disabled === undefined || !disabled)}
                helperText={error?.message}
                placeholder={placeholder}
                id={name}
                fullWidth
                inputProps={inputProps}
                disabled={disabled}
                variant="standard"
                margin="dense"
                color="primary"
                {...params}
              />
            )
          )}
        />
      )}
    />
  );
}