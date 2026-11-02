import cn from 'clsx';
import { PropsWithChildren } from 'react';

type BaseLabelProps = {
  required?: boolean;
  textColor?: string;
  className?: string;
  htmlFor?: string;
};

export const BaseLabel = ({
  children,
  textColor = 'text-white',
  required = false,
  className,
  htmlFor
}: PropsWithChildren<BaseLabelProps>) => {
  return (
    <label htmlFor={htmlFor} className={cn(textColor, className, 'block text-sm font-medium mb-2')}>
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};
