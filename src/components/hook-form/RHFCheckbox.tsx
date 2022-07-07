// form
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { Checkbox, FormControlLabel, FormGroup, FormHelperText, FormControlLabelProps } from '@mui/material';
import { ErrorMessage } from '@hookform/error-message';

// ----------------------------------------------------------------------
interface RHFCheckboxProps extends Omit<FormControlLabelProps, 'control'> {
  name: string;
}

export function RHFCheckbox({ name, ...other }: RHFCheckboxProps) {
  const { control } = useFormContext();

  return (
    <FormControlLabel
      control={
        <Controller
          name={name}
          control={control}
          render={({ field, formState: {errors} }) => <>
          <Checkbox {...field} checked={field.value === true} />
          <ErrorMessage errors={errors} name={name} render={({message}) => <FormHelperText error>{message}</FormHelperText>} />
          </>
          }
        />
      }
      {...other}
    />
  );
}

// ----------------------------------------------------------------------
interface RHFMultiCheckboxProps extends Omit<FormControlLabelProps, 'control' | 'label'> {
  name: string;
  options: {
    label: React.ReactNode;
    value: string;
  }[];
}

export function RHFMultiCheckbox({ name, options, ...other }: RHFMultiCheckboxProps) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: {error} }) => {
        const onSelected = (option: string) =>
        field.value.includes(option)
          ? field.value.filter((value: string) => value !== option)
          : [...field.value, option];
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
