// form
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { Radio, RadioGroup, FormHelperText, FormControlLabel } from '@mui/material';
import { Key } from 'react';

// ----------------------------------------------------------------------
export default function RHFRadioGroup({ name, options, ...other } : { name: string, options: { value : Key, label: React.ReactNode, disabled: boolean }[], [index:string]: any }) {
  const { control } = useFormContext();
  return (
    <Controller
      name={name}
      control={control}
      defaultValue=''
      render={({ field, fieldState: { error } }) => (
        <div>
          <RadioGroup {...field} row {...other} /*onChange={() => trigger([name])}*/ >
            {options.map((option) => (
              <FormControlLabel key={option.value} value={option.value} disabled={option.disabled} control={<Radio />} label={option.label} />
            ))}
          </RadioGroup>

          {!!error && (
            <FormHelperText error sx={{ px: 2 }}>
              {error.message}
            </FormHelperText>
          )}
        </div>
      )}
    />
  );
}
