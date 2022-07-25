// form
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { TextField, TextFieldProps } from '@mui/material';
import { StaticDatePicker, StaticDatePickerProps } from '@mui/x-date-pickers';

// ----------------------------------------------------------------------
type IProps = {
  name: string;
  readOnly?: boolean;
};

type Props = IProps & TextFieldProps;

export function RHFTextField({ name, readOnly, inputProps, ...other }: Props) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          fullWidth
          value={typeof field.value === 'number' && field.value === 0 ? '' : field.value}
          error={!!error}
          helperText={error?.message ?? " "}
          {...other}
          inputProps={ {readOnly: readOnly, ...inputProps }}
        />
      )}
    />
  );
}

// ----------------------------------------------------------------------

type RHFDatePickerProps<TInputDate, TDate> = IProps & Omit<StaticDatePickerProps<TInputDate, TDate>, 'value' | 'onSubmit' | 'onChange' | 'renderInput'>;

export function RHFDatePicker<TInputDate, TDate>({ name, ...other }: RHFDatePickerProps<TInputDate, TDate>) {
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
          return <StaticDatePicker
          {...other}
          displayStaticWrapperAs="desktop"
          openTo="day"
          value={value || ""}
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