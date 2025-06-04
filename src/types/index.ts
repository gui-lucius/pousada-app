// src/types/index.ts

export interface Hospede {
  nome: string;
  documento: string;
  telefone: string;
  email?: string;
}

export interface Reserva {
  id: string;
  hospede: Hospede;
  dataEntrada: string;
  dataSaida: string;
  numeroPessoas: number;
  chale: string;
  status: 'confirmada' | 'pendente';
  valor: number;
  observacoes?: string;
}

export interface Consumo {
  id: string;
  hospedeId: string;
  item: string;
  quantidade: number;
  valorUnitario: number;
  data: string;
}

export interface CheckIn {
  id: string;
  hospede: Hospede;
  dataEntrada: string;
  dataSaidaPrevista: string;
  numeroPessoas: number;
  chale: string;
  observacoes?: string;
}

export interface CheckOut {
  checkinId: string;
  dataSaidaReal: string;
  consumo: Consumo[];
  formaPagamento: string;
  total: number;
}
