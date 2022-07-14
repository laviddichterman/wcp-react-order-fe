import { IMaskInput } from 'react-imask';
// import {AnyMaskedOptions} from 'imask';
import _ from 'lodash';

import { FormControl, Input, InputProps, InputLabel } from '@mui/material';
import React from 'react';


interface CustomProps {
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string;
  // definitions: AnyMaskedOptions;
  // mask: string;
}


const TextMaskCustom = React.forwardRef<HTMLElement, CustomProps>(
  function TextMaskCustom(props, ref) {
    const { onChange, ...other } = props;
    return (
      <IMaskInput
        {...other}
        mask="***-**-***-CCCCCCCC"
        definitions={{
          'C': /[A-Z0-9]/,
        }}
        // @ts-ignore
        inputRef={ref}
        onAccept={(value: any) => onChange({ target: { name: props.name, value } })}
        overwrite
      />
    );
  },
);

export interface StoreCreditInputComponentProps {
  name: string;
  label: React.ReactNode;
  onChange: (event: { target: { name: string; value: string } }) => void;
  id: string;
  // mask: string;
  // definitions: AnyMaskedOptions;
  value: unknown;
}

export function StoreCreditInputComponent({ 
  name, 
  label, 
  onChange, 
  id = _.uniqueId('sci-'), 
  value, 
  ...others }: StoreCreditInputComponentProps & InputProps) {
  return (<FormControl variant="standard">
    <InputLabel htmlFor={id}>{label}</InputLabel>
    <Input
      {...others}
      value={value}
      onChange={onChange}
      name={name}
      id={id}
      // @ts-ignore
      inputComponent={TextMaskCustom}
    />
  </FormControl>)
}

