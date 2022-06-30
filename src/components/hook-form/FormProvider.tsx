import { FormProvider as Form, UseFormReturn } from 'react-hook-form';

export default function FormProvider<FormDataType, TContextType = any>({ children, onSubmit, methods } : { children : React.ReactNode, onSubmit?: React.FormEventHandler<HTMLFormElement>, methods: UseFormReturn<FormDataType, TContextType> }) {
  return (
    <Form {...methods}>
      <form onSubmit={onSubmit}>{children}</form>
    </Form>
  );
}
