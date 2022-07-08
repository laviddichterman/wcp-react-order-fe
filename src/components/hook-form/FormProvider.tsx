import { ReactNode } from 'react';
// form
import { FormProvider as Form, UseFormReturn } from 'react-hook-form';

// ----------------------------------------------------------------------

type Props<FormDataType, TContextType> = {
  children: ReactNode;
  methods: UseFormReturn<FormDataType, TContextType>;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
};

export function FormProvider<FormDataType, TContextType = any>({ children, onSubmit, methods }: Props<FormDataType, TContextType>) {
  return (
    <Form {...methods}>
      <form onSubmit={onSubmit}>{children}</form>
    </Form>
  );
}
