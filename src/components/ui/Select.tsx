import { SelectHTMLAttributes } from 'react';

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: string[] | Option[];
}

export default function Select({ label, options, ...rest }: SelectProps) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        {...rest}
        className="w-full border border-gray-300 bg-white text-black rounded px-3 py-2 text-base min-h-[44px] shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
      >
        <option value="">Selecione...</option>
        {options.map((opt, idx) =>
          typeof opt === 'string' ? (
            <option key={idx} value={opt}>{opt}</option>
          ) : (
            <option key={idx} value={opt.value}>{opt.label}</option>
          )
        )}
      </select>
    </div>
  );
}
