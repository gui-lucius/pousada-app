import { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  texto?: string;
  children?: ReactNode;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export default function Botao({
  texto,
  children,
  loading = false,
  iconLeft,
  iconRight,
  variant = 'primary',
  className,
  disabled,
  ...rest
}: BotaoProps) {
  const baseStyle =
    'inline-flex items-center justify-center px-4 py-2 rounded-md font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-black hover:bg-gray-300 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      {...rest}
      className={clsx(
        baseStyle,
        variants[variant],
        disabled || loading ? 'opacity-60 cursor-not-allowed' : '',
        className
      )}
      disabled={disabled || loading}
    >
      {loading ? (
        <span className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
      ) : (
        iconLeft && <span className="mr-2">{iconLeft}</span>
      )}

      {texto || children}

      {iconRight && !loading && <span className="ml-2">{iconRight}</span>}
    </button>
  );
}
