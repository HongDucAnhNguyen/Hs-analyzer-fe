import cn from 'clsx';
import React, { ButtonHTMLAttributes, PropsWithChildren, Ref, forwardRef, useMemo } from 'react';

export interface BaseButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'ref' | 'variant'> {
  gradient?: boolean;
  variant?: 'text' | 'filled' | 'gradient' | 'link' | 'outline';
}

export const BaseButton = forwardRef<HTMLButtonElement, PropsWithChildren<BaseButtonProps>>(
  ({ className, children, disabled, variant = 'filled', ...rest }, ref) => {
    const style = useMemo(() => {
      switch (variant) {
        case 'text':
          return 'bg-transparent text-grey8 shadow-none hover:shadow-none p-0';
        case 'link':
          return 'bg-transparent text-blue shadow-none hover:shadow-none p-0';
        case 'gradient':
          return 'bg-emh-gradient';
        case 'filled':
          return 'bg-primary1';
        case 'outline':
          return 'text-primary1 bg-transparent border-primary1 border-[2px]';
      }
    }, [variant]);

    return (
      <button
        className={cn(
          style,
          className,
          disabled && 'hover:cursor-not-allowed opacity-20',
          "cursor-pointer"
        )}
        ref={ref as Ref<HTMLButtonElement>}
        disabled={disabled}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

BaseButton.displayName = 'BaseButton';
