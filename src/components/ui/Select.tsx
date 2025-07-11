import { SelectHTMLAttributes, useId } from 'react';
import clsx from 'clsx';

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[] | Option[];
  error?: string;
  inputSize?: 'sm' | 'md' | 'lg';
  placeholder?: string;
}

export default function Select({
  label,
  options,
  error,
  inputSize = 'md',
  placeholder = 'Selecione...',
  ...rest
}: SelectProps) {
  const selectId = useId();

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg',
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={selectId} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <select
        id={selectId}
        aria-invalid={!!error}
        {...rest}
        className={clsx(
          'w-full bg-white text-black rounded shadow-sm border transition focus:outline-none focus:ring-2',
          sizeClasses[inputSize],
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:ring-blue-500',
          'appearance-none'
        )}
      >
        <option value="">{placeholder}</option>

        {options.map((opt, idx) =>
          typeof opt === 'string' ? (
            <option key={idx} value={opt}>{opt}</option>
          ) : (
            <option key={idx} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
