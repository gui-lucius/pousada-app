import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function Input({ label, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1 w-full">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className={`border px-3 py-2 rounded outline-none focus:ring-2 focus:ring-blue-500 text-black ${props.className || ''}`}
      />
    </div>
  );
}
