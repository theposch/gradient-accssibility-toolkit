declare module 'sonner' {
  import { FC } from 'react';

  export interface ToasterProps {
    position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
    richColors?: boolean;
  }

  export const Toaster: FC<ToasterProps>;

  export function toast(message: string): void;
  export namespace toast {
    function success(msg: string): void;
    function error(msg: string): void;
    function info(msg: string): void;
  }
} 