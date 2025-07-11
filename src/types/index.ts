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
  id: number;
  nome: string;
  dataNascimento: string;
  sexo: string;
  telefone: string;
  email: string;
  nacionalidade: string;
  documento: string;
  endereco: string;
  bairro: string;
  numero: string;
  cidade: string;
  estado: string;
  cep: string;
  acompanhantes: string;
  entrada: string;
  saida: string;
  chale: string;
  valor: string;

  // ✅ Campos adicionados para cálculo por hóspede
  valorEntrada?: string;
  adultos?: string;
  criancas0a3?: string;
  criancas4a9?: string;
  descontoPersonalizado?: string;
}

export interface CheckOut {
  checkinId: string;
  dataSaidaReal: string;
  consumo: Consumo[];
  formaPagamento: string;
  total: number;
}

export interface Usuario {
  id: string;
  nome: string;
  senha: string;
  permissao: 'usuario' | 'super';
}
