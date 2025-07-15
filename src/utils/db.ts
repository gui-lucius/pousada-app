import Dexie, { Table } from 'dexie';
import { Usuario as UsuarioTipo } from './auth';
import {
  criptografarObjeto,
  descriptografarObjeto
} from './criptografia'; // ← NOVO

export interface Reserva {
  id: number;
  nome: string;
  telefone: string;
  dataEntrada: string;
  dataSaida: string;
  numeroPessoas: string;
  chale: string;
  valor: string;
  observacoes: string;
  status: 'reservado';
  valorEntrada?: string;
  criancas0a3?: string;
  criancas4a9?: string;
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
  valorEntrada?: string;
  adultos?: string;
  criancas0a3?: string;
  criancas4a9?: string;
  descontoPersonalizado?: string;
}

export interface ItemComanda {
  nome: string;
  preco: number;
  quantidade: number;
  desconto50?: boolean;
  categoria: string;
  pago?: boolean;
}

export interface Subcomanda {
  id: string;
  nome: string;
  itens: ItemComanda[];
  total: number;
}

export interface Consumo {
  id: number;
  cliente: string;
  checkinId: number;
  hospede: boolean;
  subcomandas: Subcomanda[];
  status: 'aberta' | 'fechada' | 'paga';
  criadoEm: string;
}

export interface Checkout {
  id?: number;
  nome: string;
  chale: string;
  data: string;
  valor: number;
}

export interface Despesa {
  id: string;
  categoria: string;
  nome: string;
  valor: number;
  data: string;
}

export interface ProdutoComanda {
  id: string;
  categoria: string;
  nome: string;
  valor: number;
  ativo: boolean;
  tipoUsavelEmComanda: boolean;
}

export interface PrecosConfig {
  id: string;
  hospedagem: {
    individual: { comCafe: number; semCafe: number };
    casal: { comCafe: number; semCafe: number };
    tresPessoas: { comCafe: number; semCafe: number };
    quatroPessoas: { comCafe: number; semCafe: number };
    maisQuatro: { comCafe: number; semCafe: number };
    criancas: {
      de0a3Gratuito: boolean;
      de4a9: number;
      aPartir10: 'adulto';
    };
    descontoReserva?: {
      aplicar: boolean;
      percentual: number;
      minDiarias: number;
    };
  };
  restaurante: {
    almocoTradicional: number;
    almocoBuffet: number;
    descontoGeral: number;
  };
  produtos: {
    porPeso: { nome: string; precoPorKg: number }[];
    unitarios: { nome: string; preco: number }[];
  };
  servicos: { nome: string; preco: number }[];
  jantar: { nome: string; preco: number }[];
  categoriasExtras: Record<
    string,
    {
      emoji: string;
      usarEmComanda?: boolean;
      porKg?: boolean;
      itens: { nome: string; preco: number }[];
    }
  >;
}

class PousadaDB extends Dexie {
  reservas!: Table<any, number>;
  checkins!: Table<any, number>;
  despesas!: Table<any, string>;
  consumos!: Table<Consumo, number>;
  checkouts!: Table<Checkout, number>;
  precos!: Table<PrecosConfig, string>;
  produtos!: Table<ProdutoComanda, string>;
  usuarios!: Table<UsuarioTipo, string>;

  constructor() {
    super('PousadaDB');
    this.version(2).stores({
      reservas: '++id, nome, telefone, chale, dataEntrada, dataSaida',
      checkins: '++id, nome, telefone, chale, entrada, saida',
      consumos: '++id, cliente, checkinId, status, criadoEm',
      checkouts: '++id, data, nome, chale',
      despesas: 'id, categoria, data',
      precos: 'id',
      produtos: 'id, categoria, nome, tipoUsavelEmComanda',
      usuarios: 'nome',
    });

    this.reservas.mapToClass(ReservaCripto);
    this.checkins.mapToClass(CheckinCripto);
    this.despesas.mapToClass(DespesaCripto);
  }
}

// 🧠 Classes intermediárias para salvar os dados criptografados
class ReservaCripto {
  static encrypt(obj: Reserva) {
    return criptografarObjeto(obj);
  }

  static decrypt(obj: any): Reserva {
    return descriptografarObjeto(obj);
  }
}

class CheckinCripto {
  static encrypt(obj: CheckIn) {
    return criptografarObjeto(obj);
  }

  static decrypt(obj: any): CheckIn {
    return descriptografarObjeto(obj);
  }
}

class DespesaCripto {
  static encrypt(obj: Despesa) {
    return criptografarObjeto(obj);
  }

  static decrypt(obj: any): Despesa {
    return descriptografarObjeto(obj);
  }
}

export const db = new PousadaDB();
