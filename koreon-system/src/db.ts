import { 
  type Cliente, 
  type ServicoContratado, 
  type Pagamento, 
  type Affiliate,
  StatusServico,
  StatusPagamento,
  NivelRisco,
  PrioridadeOperacional,
  TipoPessoa
} from './types';

const STORAGE_KEY = 'koreon_business_v5_final';

interface DB {
  clientes: Cliente[];
  servicos: ServicoContratado[];
  pagamentos: Pagamento[];
  afiliados: Affiliate[];
  movimentacoes: any[];
}

const initialDB: DB = {
  clientes: [],
  servicos: [],
  pagamentos: [],
  afiliados: [],
  movimentacoes: []
};

export const getDB = (): DB => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : initialDB;
};

export const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};

// Função unificada para criar cliente (atende CRM e ERP)
export const createUnifiedClient = (data: any) => {
  const db = getDB();
  const id = `cli_${Date.now()}`;
  const novoCliente: Cliente = {
    id,
    nome: data.nome || data.name,
    tipo: data.tipo || TipoPessoa.FISICA,
    documento: data.documento || data.cpf,
    telefone: data.telefone || data.phone,
    email: data.email || '',
    dataCadastro: new Date().toISOString(),
    riskScore: 0,
    riskLevel: NivelRisco.BAIXO,
    prioridade: PrioridadeOperacional.NORMAL,
    totalContracted: 0,
    paid: 0,
    pending: 0,
    status: 'Lead'
  };
  db.clientes.push(novoCliente);
  saveDB(db);
  return id;
};