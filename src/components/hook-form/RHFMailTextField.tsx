// form
import { useFormContext, Controller } from 'react-hook-form';
// @mui
import { TextField, TextFieldProps } from '@mui/material';
// mailcheck
import Mailcheck from 'mailcheck';
import { useCallback } from 'react';


// ----------------------------------------------------------------------
type IProps = {
  name: string;
};

type Props = IProps & TextFieldProps;

export function RHFMailTextField({ name, ...other }: Props) {
  const { control } = useFormContext();
  const getSuggestion = useCallback((value: string) => {
    let sug = ""
    const cb = (suggestion: MailcheckModule.ISuggestion) => {
      console.log(suggestion);
      sug = suggestion.full;
    };
    Mailcheck.run({ email: value, suggested: cb });
    console.log(sug)
    return sug;
  }, []);
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const suggestion = getSuggestion(field.value);
        return (
          <TextField
            {...field}
            fullWidth
            value={field.value}
            error={!!error}
            helperText={error?.message || (suggestion ? `Did you mean ${suggestion}?` : "")}
            {...other}
          />
        )
      }}
    />
  );
}