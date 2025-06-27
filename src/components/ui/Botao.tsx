import { ButtonHTMLAttributes } from 'react';

interface BotaoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  texto: string;
}

export default function Botao({ texto, ...rest }: BotaoProps) {
  return (
    <button
      {...rest}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
    >
      {texto}
    </button>
  );
}
