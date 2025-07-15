import { InputHTMLAttributes, useId } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefixoMonetario?: boolean;
  error?: string;
  inputSize?: 'sm' | 'md' | 'lg';
}

export default function Input({
  label,
  prefixoMonetario,
  error,
  inputSize = 'md',
  ...props
}: InputProps) {
  const isNumero = props.type === 'number';
  const inputId = useId();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (prefixoMonetario && isNumero && props.onChange) {
      const num = Number(e.target.value);
      const positivo = Math.max(0, num);

      // Criando um novo evento com target atualizado
      const customEvent: React.ChangeEvent<HTMLInputElement> = {
        ...e,
        target: {
          ...e.target,
          value: positivo.toString(),
        },
      };

      props.onChange(customEvent);
    } else {
      props.onChange?.(e);
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg',
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div
        className={clsx(
          'flex items-center bg-white border rounded shadow-sm transition focus-within:ring-2 focus-within:ring-blue-500',
          sizeClasses[inputSize],
          error ? 'border-red-500 focus-within:ring-red-500' : 'border-gray-300'
        )}
      >
        {prefixoMonetario && <span className="mr-2 text-gray-600">R$</span>}

        <input
          id={inputId}
          {...props}
          onChange={handleChange}
          aria-invalid={!!error}
          className="flex-1 bg-transparent text-black outline-none placeholder-gray-400"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
