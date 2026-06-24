import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

// Shared button used across menus. Styling lives in globals.css under .btn.
export default function Button({
  variant = 'primary',
  className = '',
  ...rest
}: ButtonProps) {
  return <button className={`btn btn--${variant} ${className}`.trim()} {...rest} />;
}
