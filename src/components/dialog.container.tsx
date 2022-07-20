import React from 'react';
import { Divider, DialogTitle, Dialog, DialogProps } from '@mui/material';

// TODO: move to commmon react library

export interface IDialogContainer { 
  onClose: Exclude<DialogProps['onClose'], undefined>;
  title: string;
  inner_component: React.ReactNode;
  open: boolean;
};

function DialogContainer({ onClose, title, open, inner_component, ...other } : IDialogContainer & Omit<DialogProps, 'onClose' | 'open'>) {
  return (
    <Dialog {...other} open={open} onClose={onClose}>
      <DialogTitle id="simple-dialog-title">{title}</DialogTitle>
      <Divider />
      {inner_component}
    </Dialog>
  );
}

export default DialogContainer;