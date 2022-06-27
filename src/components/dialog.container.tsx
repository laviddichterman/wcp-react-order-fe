import React from 'react';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';

interface IDialogContainer { 
  onClose: (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void;
  title: string;
  inner_component: React.ReactNode;
  open: boolean;
  [index:string] : any;
};

function DialogContainer({ onClose, title, inner_component, open, ...other } : IDialogContainer) {
  return (
    <Dialog {...other} onClose={onClose} aria-labelledby="simple-dialog-title" open={open}>
      <DialogTitle id="simple-dialog-title">{title}</DialogTitle>
      <Divider />
      {inner_component}
    </Dialog>
  );
}

export default DialogContainer;